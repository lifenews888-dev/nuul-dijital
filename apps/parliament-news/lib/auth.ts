import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@nuul/db-news";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

/**
 * Редакцын систем: зөвхөн имэйл/нууц үг, гадны provider байхгүй.
 * Хэрэглэгч нь мэдээний өөрийн өгөгдлийн санд (pn_users) байрлана —
 * nuul.mn-ийн users хүснэгттэй хуваалцахгүй. Эрх нь session-д байхгүй,
 * tenant тус бүрээр TenantMember-ээс tRPC context дээр шийдэгдэнэ.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Имэйл", type: "email" },
        password: { label: "Нууц үг", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Имэйл болон нууц үг оруулна уу");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) {
          throw new Error("Имэйл эсвэл нууц үг буруу байна");
        }

        const passwordValid = await compare(credentials.password, user.password);

        if (!passwordValid) {
          throw new Error("Имэйл эсвэл нууц үг буруу байна");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/studio/signin",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name ?? null;
      }
      return session;
    },
  },
};
