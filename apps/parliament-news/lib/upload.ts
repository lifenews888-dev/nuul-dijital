/**
 * Байршуулах файлын шалгалт — төрөл ба хэмжээ.
 *
 * Blob нь файлыг өөрийн домэйнаас ШУУД үйлчилдэг. `.svg`, `.html` тэнд
 * очвол тэр домэйн дээр script ажиллах ба манай брэндийн хаягаар
 * фишинг хуудас байршуулах боломж нээгдэнэ. Хэмжээний хязгааргүй бол
 * нэг хүн квотыг дүүргэж, бусдын ажлыг зогсооно.
 *
 * ЦЭВЭР функц: `app/api/upload/route.ts` ба `attachMedia` ХОЁУЛАА
 * үүнийг дуудна — хоёр газар өөр дүрэм бичвэл аль нэг нь сул үлдэнэ.
 */

export type UploadKind = "image" | "video";

/** SVG нь ЗОРИУД алга */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const VIDEO_TYPES = ["video/mp4", "video/webm"];

export const IMAGE_MAX = 8 * 1024 * 1024;
export const VIDEO_MAX = 200 * 1024 * 1024;

export function allowedTypes(kind: UploadKind): string[] {
  return kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
}

export function maxBytes(kind: UploadKind): number {
  return kind === "image" ? IMAGE_MAX : VIDEO_MAX;
}

const mb = (bytes: number) => Math.round(bytes / (1024 * 1024));

export type UploadCheck = { ok: true } | { ok: false; reason: string };

export function checkUpload(
  file: { type: string; size: number },
  kind: UploadKind,
): UploadCheck {
  /** `image/jpeg; charset=utf-8` маягийн параметрийг таслана */
  const type = file.type.split(";")[0].trim().toLowerCase();

  if (!allowedTypes(kind).includes(type)) {
    return {
      ok: false,
      reason:
        kind === "image"
          ? "Энэ төрлийн файл зөвшөөрөгдөхгүй. JPEG, PNG, WebP, AVIF байна."
          : "Энэ төрлийн файл зөвшөөрөгдөхгүй. MP4 эсвэл WebM байна.",
    };
  }

  if (file.size <= 0) {
    return { ok: false, reason: "Файл хоосон байна." };
  }

  const max = maxBytes(kind);
  if (file.size > max) {
    return { ok: false, reason: `Файл хэт том байна — дээд тал нь ${mb(max)} МБ.` };
  }

  return { ok: true };
}
