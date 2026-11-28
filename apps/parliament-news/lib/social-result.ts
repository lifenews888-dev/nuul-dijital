/**
 * Адаптерын хариуг санд бичих төлөв болгоно.
 *
 * Цэвэр функц: сүлжээний хариу бүрт ямар төлөв гарахыг API түлхүүргүйгээр
 * тестлэнэ. Хамгийн чухал ялгаа нь SKIPPED ба FAILED хоёр — ТОХИРУУЛААГҮЙ
 * суваг нь алдаа БИШ. Түүнийг FAILED болговол дараалал нь хэзээ ч
 * засагдахгүй мөрүүдээр дүүрч, жинхэнэ алдаа тэдний дунд алга болно.
 */
export type SendResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string; configured: boolean };

export type RowUpdate = {
  status: "SENT" | "FAILED" | "SKIPPED";
  attempts: number;
  error: string | null;
  remoteUrl: string | null;
  sentAt: Date | null;
};

const ERROR_MAX = 400;

export function resultToUpdate(
  result: SendResult,
  attempts: number,
  now: Date = new Date(),
): RowUpdate {
  if (result.ok) {
    return { status: "SENT", attempts, error: null, remoteUrl: result.url, sentAt: now };
  }

  if (!result.configured) {
    return { status: "SKIPPED", attempts, error: result.error.slice(0, ERROR_MAX), remoteUrl: null, sentAt: null };
  }

  return {
    status: "FAILED",
    attempts: attempts + 1,
    error: result.error.slice(0, ERROR_MAX),
    remoteUrl: null,
    sentAt: null,
  };
}
