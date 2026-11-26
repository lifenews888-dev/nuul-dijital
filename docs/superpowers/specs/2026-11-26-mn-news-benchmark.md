# Монголын мэдээний сайтуудын хэмжилт — суурь тоонууд

Хэнд: Parliament News-ийг хөгжүүлэх, хянах, нээх хүн.
Хэмжсэн: 2026-11-26, Улаанбаатараас, гэрийн интернэтээр.
Хэрэглэгддэг газар: `2026-11-26-parliament-news-phase2-public-site.md`-ийн
«Хэмжигдэх зорилт», `apps/parliament-news/DEPLOY-CHECKLIST.md`-ийн 5-р хэсэг,
платформын дизайн бичгийн 8-р хэсгийн техникийн эрсдэл.

Эдгээр нь бодит хэмжилт. Нэг компьютер, нэг сүлжээнээс авсан тул яг тоо нь
хувьсана — зорилго нь дэс дарааллыг тогтоох: хэн хурдан, хэн юуг хийдэггүй.

## 1. Технологи

| Сайт | Server | Framework | Тайлбар |
|---|---|---|---|
| montsame.mn | Vercel | **Next.js** | Улсын үндэсний агентлаг, яг манай стек |
| gogo.mn | nginx/1.24 (Ubuntu) | **Next.js** | |
| eagle.mn | Cloudflare | **Next.js** | |
| news.mn | nginx/1.15.5 | **WordPress** | |
| ikon.mn | nginx | өөрийн | хурдны тэргүүлэгч |
| unuudur.mn | nginx | өөрийн | |
| zarig.mn | Cloudflare | өөрийн | |
| parliament.mn | nginx | **JS бүрхүүл** | нүүр нь 961 байт, SEO-гүй |

Next.js нь Монголд шинэ ч, экзотик ч биш — орчин үеийн тэргүүлэх гурван сайт
аль хэдийн үүн дээр. Стек нь өөрөө давуу тал биш.

## 2. Нийтлэлийн хуудас

| | ikon.mn | gogo.mn | news.mn | eagle.mn |
|---|---|---|---|---|
| TTFB (нүүр, 3 удаа дундаж) | 93 мс | 68 мс | 1244 мс | 439 мс |
| HTML | 59 KB | 207 KB | 900 KB | 82 KB |
| `<script>` | 5 | 30 | 34 | 32 |
| `<img>` | 41 | 19 | 77 | 4 |
| `srcset`-тэй | 0 | 14 | 48 | 4 |
| `loading=` | 8 | 18 | 46 | 4 |
| JSON-LD | 0 | **2** | **1** | 0 |

## 3. Гол зураг (`og:image`) — хамгийн чухал хэсэг

| Сайт | Хэмжээ | Формат | `Accept: image/webp` дээр | `Vary` |
|---|---|---|---|---|
| ikon.mn | 296 KB | JPEG | **ижил JPEG** | байхгүй |
| gogo.mn | 335 KB | JPEG | **ижил JPEG** | байхгүй |
| news.mn | 466 KB | JPEG | **ижил JPEG** | байхгүй |

**Хэн ч WebP/AVIF үйлчлэхгүй, content negotiation ч хийхгүй.** `next/image` нь
үүнийг тохиргооны хоёр мөрөөр хийдэг тул 3–4 дахин жижиг зураг нь сонгосон
framework-ээс үнэгүй ирнэ. Монголын мэдээний хөдөлгөөний дийлэнх нь мобайл тул
энэ нь уншигчид бодитоор мэдрэгдэх хамгийн хямд давуу тал.

## 4. Хостингийн хоцролт — архитектурын сануулга

| | TTFB | Байршил |
|---|---|---|
| montsame.mn (**Vercel**) | **385 мс** | `X-Vercel-Id: hkg1` — Хонг Конг |
| zarig.mn (Cloudflare, `DYNAMIC`) | 188 мс | `CF-RAY: …-ULN` |
| eagle.mn (Cloudflare, `DYNAMIC`) | 439 мс | `CF-RAY: …-ULN` |
| ikon.mn (дотоод) | 93 мс | — |
| gogo.mn (дотоод) | 68 мс | — |

montsame.mn-ийн 385 мс нь `Age: 4` — кэш оногдсон байхад. Өөрөөр хэлбэл энэ нь
доод хязгаар, cold start биш. Зөвхөн Vercel дээр бол тэргүүлэгчээс 4 дахин
хоцорно.

Cloudflare-д **Улаанбаатарт POP байна**: `curl https://www.cloudflare.com/cdn-cgi/trace`
→ `colo=ULN`, `loc=MN`. Гэхдээ zarig.mn, eagle.mn хоёул Cloudflare дээр байж
`cf-cache-status: DYNAMIC` — HTML кэшлэгдэхгүй тул хүсэлт бүр origin хүртэл явна.
Cloudflare-ийг зүгээр урд тавих нь хүрэлцэхгүй, HTML кэшлэх дүрэм зориуд бичнэ.

## 5. Дахин хэмжих

```bash
# Технологи ба header
for s in parliament.mn ikon.mn news.mn gogo.mn montsame.mn eagle.mn zarig.mn; do
  curl -sIL --max-time 20 -A "Mozilla/5.0 (compatible)" "https://$s" | tr -d '\r' \
    | grep -iE '^(server|x-powered-by|x-vercel-id|cf-ray|cf-cache-status):' \
    | sed "s|^|$s  |"
done

# TTFB, 3 удаа
for s in montsame.mn ikon.mn gogo.mn news.mn; do
  for i in 1 2 3; do
    curl -s -o /dev/null -w "$s %{time_starttransfer}\n" -L --max-time 30 "https://$s"
  done
done

# Гол зургийн WebP negotiation (og:image-ийн хаягийг нийтлэлээс ав)
curl -sI -H 'Accept: image/webp,image/avif,image/*' '<og:image хаяг>' \
  | grep -iE '^(content-type|content-length|vary):'

# Cloudflare-ийн POP
curl -s https://www.cloudflare.com/cdn-cgi/trace | grep -E '^(colo|loc)='
```

## 6. Анхны буруу дүгнэлт — тэмдэглэж үлдээв

Эхэндээ сайтуудын **нүүр хуудсыг** шалгаад «Монголд хэн ч JSON-LD хийдэггүй»
гэж дүгнэсэн. Нийтлэлийн хуудсыг хэмжихэд gogo.mn 2, news.mn 1 байв. Нүүр
хуудасны тэмдэглэгээ нь нийтлэлийн тэмдэглэгээг заадаггүй — хуваалцагддаг,
хайлтад ордог зүйл бол нийтлэл. Дараа харьцуулалт хийхдээ нийтлэлийн хуудсыг
хэмжинэ.

Үүнтэй адил: ikon.mn-ийн нүүрэнд `og:image` ба `twitter:image` л байсан тул
OG нь дутуу гэж харагдсан. Нийтлэлийн хуудсанд `og:type`, `og:title`,
`og:description`, `og:url`, `og:image` бүгд зөв байна (`og:locale` нь
`en_US` — тэдний жижиг алдаа). OG-ийн талаар бид тэднийг гүйцэх, давахгүй.
