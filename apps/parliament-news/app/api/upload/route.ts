import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { studioSession } from "@/lib/studio-session";
import { allowedTypes, maxBytes, type UploadKind } from "@/lib/upload";
import { SECTIONS } from "@/lib/permissions";

/**
 * Байршуулах токен гаргагч — `@vercel/blob`-ийн client upload.
 *
 * Файл нь хөтчөөс blob руу ШУУД явна; энэ зам нь зөвхөн «болно» гэсэн
 * богино хугацааны токен өгнө. Тиймээс ХАМГААЛАЛТ НЬ ЭНД: токен авсан
 * хүн ямар ч файл байршуулж чадна, хэмжээ, төрлийг нь blob өөрөө
 * токенд бичигдсэн дүрмээр барина.
 *
 * Хоёр хаалга:
 *   1. `studioSession()` — редакцын гишүүн эсэх. Гишүүн биш хүн токен
 *      авбал манай blob квотыг хэн ч дүүргэж чадна.
 *   2. `allowedTypes` / `maxBytes` — `lib/upload.ts`-ийн нэг эх сурвалж.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const studio = await studioSession();
  if (!studio) {
    return NextResponse.json({ error: "Редакцын эрх алга" }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        /** Зураг уу, видео юу — клиент хэлнэ, бид дүрмийг нь сонгоно */
        const kind: UploadKind = clientPayload === "video" ? "video" : "image";

        /*
         * Гишүүн байх нь ХАНГАЛТГҮЙ. `ANALYST`, `LIVE` нь ямар ч хэсэг
         * засахгүй (`SECTIONS` нь хоосон) атлаа токен авч 200 МБ видео
         * байршуулж чадна — квот дүүргэхэд редакцын эрх хангалттай болно.
         * Мэдээ бүрийн төлөв энд мэдэгдэхгүй тул үүргийн ДЭЭД хязгаараар.
         */
        if (!SECTIONS[studio.actor.role].includes(kind === "video" ? "video" : "photos")) {
          throw new Error("Файл байршуулах эрх алга");
        }
        return {
          allowedContentTypes: allowedTypes(kind),
          maximumSizeInBytes: maxBytes(kind),
          /** Нэр давхцахад хуучныг дарж бичихгүй */
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ tenantId: studio.tenantId }),
        };
      },
      onUploadCompleted: async () => {
        /**
         * Мөрийг САНД бичихгүй: blob дуусахад хөтөч өөрөө
         * `studioNews.attachMedia`-г дуудна. Энэ дуудлага нь локал
         * хөгжүүлэлтэд хүрдэггүй (Vercel-ийн webhook) тул энд
         * найдвал зураг зөвхөн production-д холбогдоно.
         */
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Байршуулж чадсангүй";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
