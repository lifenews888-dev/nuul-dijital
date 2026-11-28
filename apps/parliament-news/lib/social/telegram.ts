import type { SendResult } from "../social-result";

/**
 * Telegram сувгийн адаптер.
 *
 * Гурван сүлжээнээс ЭНЭ нь л бүрэн хэрэгжсэн: Telegram-д бот үүсгээд
 * токен авахад хэдэн минут, OAuth, аппын хяналт шаардахгүй. Meta ба
 * YouTube нь апп бүртгүүлэх, тойм хүлээх үйл явцтай тул тэдгээр нь
 * тохируулагдах хүртэл SKIPPED болно (`lib/social/stub.ts`).
 */
export async function sendTelegram(text: string): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chat = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chat) {
    return {
      ok: false,
      configured: false,
      error: "TELEGRAM_BOT_TOKEN эсвэл TELEGRAM_CHAT_ID тохируулаагүй",
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text,
        /** Холбоосын урьдчилан харагдац нь постыг богиносгож, илүү уншигдана. */
        disable_web_page_preview: false,
      }),
    });

    const body = (await res.json()) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
    };

    if (!res.ok || !body.ok) {
      return { ok: false, configured: true, error: body.description ?? `HTTP ${res.status}` };
    }

    /** Нийтийн суваг бол мессежийн хаяг үүснэ; хувийн бол үгүй. */
    const handle = chat.startsWith("@") ? chat.slice(1) : null;
    const id = body.result?.message_id;
    return { ok: true, url: handle && id ? `https://t.me/${handle}/${id}` : null };
  } catch (e) {
    return { ok: false, configured: true, error: e instanceof Error ? e.message : String(e) };
  }
}
