import { check, fail, clear, LIMITS } from "./rate-limit";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@nuul/db-news";
import { newsAuthSecret, cookieName } from "./auth-env";

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
/**
 * `__Secure-` угтвар ба `secure` туг. `NEXTAUTH_URL`-ээр шийдэхгүй: тэр нь
 * nuul.mn-ийнх бөгөөд парламентын домэйныг заадаггүй.
 */
const SECURE = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Имэйл", type: "email" },
        password: { label: "Нууц үг", type: "password" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Имэйл болон нууц үг оруулна уу");
        }

        const email = credentials.email.toLowerCase().trim();

        /*
         * ХУРДНЫ ХЯЗГААР — нууц үг шалгахаас ӨМНӨ.
         *
         * Хоёр түлхүүрээр: имэйл ба IP. Зөвхөн имэйлээр хязгаарлавал
         * халдагч олон имэйл туршиж тойрно; зөвхөн IP-гээр хязгаарлавал
         * нэг оффисын сүлжээнээс орсон хэд хэдэн сэтгүүлч бие биеэ
         * хаана. Хоёулаа давхар байх нь хоёр цоорхойг хоёуланг хаана.
         *
         * Хариу нь «буруу» гэсэнтэй ИЖИЛ үг биш: хэрэглэгч хэдэн минут
         * хүлээхээ мэдэх ёстой, эс бөгөөс дахин дахин оролдоно.
         */
        const ip =
          req?.headers?.["x-forwarded-for"]?.toString().split(",")[0]?.trim() || "unknown";

        const keyEmail = `signin:e:${email}`;
        const keyIp = `signin:i:${ip}`;

        for (const [key, rule] of [
          [keyEmail, LIMITS.signinEmail],
          [keyIp, LIMITS.signinIp],
        ] as const) {
          const gate = await check(key, rule);
          if (!gate.ok) {
            const minutes = Math.ceil(gate.retryAfter / 60);
            throw new Error(
              `Хэт олон буруу оролдлого. ${minutes} минутын дараа дахин оролдоно уу.`,
            );
          }
        }

        /** Бүтэлгүй оролдлогыг хоёр түлхүүрт бүртгээд нэг л үг буцаана. */
        const wrong = async (): Promise<never> => {
          await fail(keyEmail, LIMITS.signinEmail);
          await fail(keyIp, LIMITS.signinIp);
          throw new Error("Имэйл эсвэл нууц үг буруу байна");
        };

        const user = await prisma.user.findUnique({ where: { email } });

        /*
         * `wrong()` нь `never` буцаадаг ч TypeScript нь дуудлагын дараа
         * хяналт зогссоныг мэдэхгүй — `await` нь төрлийг нарийсгахгүй.
         * Тиймээс шууд `throw`.
         */
        if (!user || !user.password) {
          throw await wrong();
        }

        const passwordValid = await compare(credentials.password, user.password);

        if (!passwordValid) {
          throw await wrong();
        }

        /** Амжилттай — тоолуурыг цэвэрлэнэ, өөрийгөө хаахгүй. */
        await clear([keyEmail, keyIp]);

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

  /**
   * nuul.mn-ээс ТУСДАА түлхүүр. `undefined` бол NextAuth нь
   * `NEXTAUTH_SECRET` руу унана — production-д `newsAuthSecret` өөрөө
   * зогсооно.
   */
  secret: newsAuthSecret(),

  /**
   * Cookie-ийн нэр ч тусдаа. Хөгжүүлэлтэд хоёр апп `localhost`-ийг
   * хуваалцдаг тул анхдагч нэрээр явбал нэгэнд нэвтрэх нь нөгөөгийнхийг
   * дарж бичнэ.
   */
  cookies: {
    sessionToken: {
      name: cookieName("session-token", SECURE),
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: SECURE },
    },
    csrfToken: {
      name: cookieName("csrf-token", SECURE),
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: SECURE },
    },
    callbackUrl: {
      name: cookieName("callback-url", SECURE),
      options: { sameSite: "lax", path: "/", secure: SECURE },
    },
  },

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
