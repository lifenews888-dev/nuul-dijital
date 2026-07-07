import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  normalizeLookupEmail,
  verifyMagicLinkToken,
} from "@/lib/domains/order-lookup";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { bootstrapCustomerAccount, ensurePersonalOrganization } from "@/lib/organizations";

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * - `admin` provider: env-based credentials for /admin
 * - `customer-magic-link` provider: one-time email link for /app
 * - `customer-password` provider: email + password for /app
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (
          email &&
          password &&
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return { id: "admin", name: "Super Admin", email, role: "SUPER_ADMIN" } as const;
        }
        return null;
      },
    }),
    Credentials({
      id: "customer-password",
      name: "Customer Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password || !process.env.DATABASE_URL) return null;

        const normalized = normalizeLookupEmail(email);
        const user = await db.user.findUnique({ where: { email: normalized } });
        if (!user?.active || user.role !== "USER" || !user.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        await ensurePersonalOrganization(user);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "USER",
        };
      },
    }),
    Credentials({
      id: "customer-magic-link",
      name: "Customer Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token as string | undefined;
        if (!token || !process.env.DATABASE_URL) return null;

        const email = verifyMagicLinkToken(token);
        if (!email) return null;

        const { user } = await bootstrapCustomerAccount(email);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "USER",
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const u = session.user as { role?: string; id?: string };
        u.role = token.role as string;
        u.id = token.sub;
      }
      return session;
    },
  },
});