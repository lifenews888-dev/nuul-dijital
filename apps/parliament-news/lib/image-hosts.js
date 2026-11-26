/**
 * Зураг үйлчлэхийг зөвшөөрсөн гадаад host.
 *
 * ЦОРЫН ГАГЦ эх сурвалж: `next.config.js` (CommonJS) ба `lib/images.ts`
 * хоёул эндээс уншина. Хоёр газар бичвэл зөрж, тест ногоон байхад
 * production-д `next/image` 400 буцаана.
 *
 * v1-д зөвхөн Vercel Blob (3-р шатны байршуулалт). Редакц гадны зургийн
 * хаяг оруулбал зөвшөөрөгдөхгүй — тэр үед хавтасны SVG зурагдана.
 */
const REMOTE_PATTERNS = [
  {
    protocol: "https",
    hostname: "**.public.blob.vercel-storage.com",
    pathname: "/**",
  },
];

/** `safeImageSrc`-ийн шалгалтад: host нь эдгээрийн аль нэгээр төгсөх ёстой */
const ALLOWED_HOST_SUFFIXES = [".public.blob.vercel-storage.com"];

module.exports = { REMOTE_PATTERNS, ALLOWED_HOST_SUFFIXES };
