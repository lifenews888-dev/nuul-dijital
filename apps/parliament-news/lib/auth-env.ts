/**
 * Редакцын сессийн тусгаарлалт — nuul.mn-ээс ӨӨР түлхүүр, ӨӨР cookie.
 *
 * Хоёр апп нэг монорепод, нэг `.env`-тэй, хөгжүүлэлтэд хоёулаа
 * `localhost`-д сууна. Анхдагчаар NextAuth нь `NEXTAUTH_SECRET`-ийг уншиж,
 * `next-auth.session-token` гэдэг нэгэн ижил cookie тавина — өөрөөр хэлбэл
 * nuul.mn-д нэвтэрсэн хүний токен парламентын `middleware`-д ХҮЧИНТЭЙ
 * болно. Үүрэг нь `TenantMember`-ээс шалгагддаг тул эрх шууд олдохгүй ч,
 * нэг аппын түлхүүр гоожихад нөгөө нь хамт онгойх шалтгаан байхгүй.
 */

/** Cookie-ийн угтвар — nuul.mn-ийн `next-auth.`-аас өөр */
export const COOKIE_PREFIX = "pn-auth.";

type Env = Record<string, string | undefined>;

/**
 * Редакцын JWT-ийн түлхүүр.
 *
 * `undefined` буцаавал NextAuth өөрөө `NEXTAUTH_SECRET` руу унана — үүнийг
 * ЗӨВХӨН хөгжүүлэлтэд зөвшөөрнө. Production-д чимээгүй унах нь хамгийн
 * дор: хэн ч мэдэхгүйгээр хоёр апп нэг түлхүүр хуваалцана.
 */
export function newsAuthSecret(env: Env = process.env): string | undefined {
  const own = env.NEWS_NEXTAUTH_SECRET?.trim();

  if (!own) {
    if (env.NODE_ENV === "production") {
      throw new Error(
        "NEWS_NEXTAUTH_SECRET тавиагүй. Редакцын сесс nuul.mn-ийн NEXTAUTH_SECRET-ийг " +
          "хуваалцах ёсгүй. Генерацлах: openssl rand -base64 32",
      );
    }
    return undefined;
  }

  if (own === env.NEXTAUTH_SECRET?.trim()) {
    throw new Error(
      "NEWS_NEXTAUTH_SECRET нь NEXTAUTH_SECRET-ээс ӨӨР байх ёстой — " +
        "ижил бол тусгаарлалт байхгүй.",
    );
  }

  return own;
}

/**
 * Cookie-ийн нэр. `https` дээр хөтөч `__Secure-` угтвартайг л тусгай
 * хамгаалалттай гэж үзнэ, иймд нэрийг өөрсдөө угтварлавал тэр угтварыг
 * мөн өөрсдөө нэмэх хэрэгтэй — NextAuth нь зөвхөн ӨӨРИЙН анхдагч нэрсэд
 * үүнийг автоматаар хийдэг.
 */
export function cookieName(base: string, secure: boolean): string {
  return `${secure ? "__Secure-" : ""}${COOKIE_PREFIX}${base}`;
}
