/**
 * Сошиал сувгийн ЦЭВЭР дүрмүүд — дараалал, текст, дахин оролдлого.
 *
 * Сүлжээний код энд БАЙХГҮЙ: адаптерууд (`lib/social/*.ts`) эдгээрийг
 * хэрэглэнэ. Ингэснээр текстийн таслалт, дахин оролдлогын бодлого нь
 * API түлхүүргүйгээр бүрэн тестлэгдэнэ.
 */

export type ChannelKey = "facebook" | "youtube" | "instagram" | "tiktok" | "telegram";

export const CHANNELS: ReadonlyArray<{ key: ChannelKey; label: string }> = [
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "telegram", label: "Telegram" },
];

/** Нийтлэл нэг постод багтах дээд урт. Instagram-ийн 2200 нь хамгийн нарийн. */
export const TEXT_MAX = 2200;

/** Нэг мөрийг хэдэн удаа илгээхийг оролдох вэ */
export const MAX_ATTEMPTS = 3;

const BY_LABEL = new Map(CHANNELS.map((c) => [c.label.toLowerCase(), c.key]));

/**
 * Редакцын сонгосон нэрийг техникийн түлхүүр болгоно.
 *
 * «Сайт» нь суваг БИШ: мэдээ сайтдаа аль хэдийн нийтлэгдсэн байна.
 * Түүнийг дараалалд оруулбал хоосон ажил үүсч, хэзээ ч амжилттай
 * болохгүй мөр дарааллыг бөглөнө.
 */
export function channelKey(label: string): ChannelKey | null {
  return BY_LABEL.get(label.trim().toLowerCase()) ?? null;
}

/** Мэдээний сувгуудаас дараалалд орох боломжтойг нь, давхардалгүй. */
export function queueableChannels(labels: string[]): ChannelKey[] {
  const out: ChannelKey[] = [];
  for (const label of labels) {
    const key = channelKey(label);
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

/**
 * Постын текст. Холбоос нь ҮРГЭЛЖ бүтэн үлдэнэ — таслагдсан холбоос нь
 * постыг утгагүй болгоно, уншигч мэдээ рүү орох замгүй болно.
 */
export function composeText({
  title,
  lead,
  url,
}: {
  title: string;
  lead: string | null;
  url: string;
}): string {
  const tail = `\n\n${url}`;
  const room = Math.max(0, TEXT_MAX - tail.length);

  const cut = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, Math.max(0, max - 1))}…`);

  const head = title.trim();
  if (!lead?.trim()) return cut(head, room) + tail;

  const body = lead.trim();
  /** Эхлээд товч агуулгыг таслана; гарчиг нь мэдээг таних гол зүйл. */
  const titlePart = cut(head, room);
  const leftForLead = room - titlePart.length - 2;
  if (leftForLead <= 1) return titlePart + tail;

  return `${titlePart}\n\n${cut(body, leftForLead)}${tail}`;
}

export type QueueRow = { status: string; attempts: number };

/** Илгээх ёстой эсэх. Амжилттай нь дахин явахгүй, оролдлого нь хязгаартай. */
export function canRetry(row: QueueRow): boolean {
  if (row.status === "SENT" || row.status === "SKIPPED") return false;
  return row.attempts < MAX_ATTEMPTS;
}
