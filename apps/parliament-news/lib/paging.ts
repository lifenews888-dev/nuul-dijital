/**
 * Хуудаслалтын цэвэр тооцоо.
 *
 * URL-ийн `?page=` нь чөлөөт текст: тоо биш, сөрөг, бутархай, хүрээнээс
 * гадуур утга ирж болно. Аль нь ч 404 биш — хамгийн ойрын зөв хуудсыг
 * үзүүлнэ, ингэснээр хуучин холбоос, робот хоёулаа ажиллах хуудас олно.
 */
export type PageParams = {
  page: number;
  skip: number;
  take: number;
  pages: number;
};

export function pageParams(
  raw: string | string[] | undefined,
  perPage: number,
  total: number,
): PageParams {
  const first = Array.isArray(raw) ? raw[0] : raw;

  // Зөвхөн бүхэл тоон мөрийг хүлээж авна: "1.5", "1e3", "٣" нь 1-р хуудас
  const asked = typeof first === "string" && /^\d+$/.test(first) ? Number(first) : 1;

  const pages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(pages, Math.max(1, asked));

  return { page, skip: (page - 1) * perPage, take: perPage, pages };
}
