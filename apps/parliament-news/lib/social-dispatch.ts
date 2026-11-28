import { prisma } from "@nuul/db-news";
import { MAX_ATTEMPTS } from "./social";
import { resultToUpdate, type SendResult } from "./social-result";
import { sendTelegram } from "./social/telegram";
import { notConfigured } from "./social/stub";

/**
 * Дараалалд байгаа постуудыг илгээнэ.
 *
 * Tenant-аар хязгаарлахгүй: энэ нь хүн биш, cron дуудна — сесс, tenant
 * байхгүй. Мөр бүр өөрийн `tenantId`-тай тул холилдохгүй. `forTenant`
 * хэрэглэвэл cron аль tenant-ынх болохыг мэдэхгүй.
 */
const BATCH = 20;

async function send(channel: string, text: string): Promise<SendResult> {
  if (channel === "telegram") return sendTelegram(text);
  return notConfigured(channel);
}

export type DispatchReport = { picked: number; sent: number; failed: number; skipped: number };

export async function dispatchSocial(now: Date = new Date()): Promise<DispatchReport> {
  const rows = await prisma.socialPost.findMany({
    where: { status: { in: ["QUEUED", "FAILED"] }, attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: "asc" },
    take: BATCH,
  });

  const report: DispatchReport = { picked: rows.length, sent: 0, failed: 0, skipped: 0 };

  for (const row of rows) {
    const result = await send(row.channel, row.text ?? "");
    const update = resultToUpdate(result, row.attempts, now);

    await prisma.socialPost.update({ where: { id: row.id }, data: update });

    if (update.status === "SENT") report.sent += 1;
    else if (update.status === "FAILED") report.failed += 1;
    else report.skipped += 1;
  }

  return report;
}
