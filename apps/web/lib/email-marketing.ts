import { Resend } from "resend";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";

const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL || "Nuul.digital <onboarding@resend.dev>";

const BATCH_SIZE = 50;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export function generateUnsubToken(subscriberId: string): string {
  return Buffer.from(subscriberId).toString("base64");
}

function decodeUnsubToken(token: string): string {
  return Buffer.from(token, "base64").toString("utf-8");
}

function buildUnsubLink(subscriberId: string): string {
  const token = generateUnsubToken(subscriberId);
  const baseUrl = process.env.NEXTAUTH_URL || "https://nuul.digital";
  return `${baseUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

function appendUnsubLink(html: string, subscriberId: string): string {
  const link = buildUnsubLink(subscriberId);
  const footer = `
    <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888;">
      <a href="${link}" style="color:#888;">Захиалга цуцлах</a>
    </div>`;
  return html + footer;
}

export async function sendCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: { list: { include: { subscribers: true } } },
  });

  if (!campaign) {
    throw new Error("Кампанит ажил олдсонгүй");
  }

  if (!campaign.list) {
    throw new Error("Кампанит жагсаалт холбогдоогүй байна");
  }

  const activeSubscribers = campaign.list.subscribers.filter(
    (s) => s.status === "ACTIVE"
  );

  if (activeSubscribers.length === 0) {
    throw new Error("Идэвхтэй захиалагч олдсонгүй");
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { status: "SENDING" },
  });

  const resend = getResend();
  let sentCount = 0;

  for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
    const batch = activeSubscribers.slice(i, i + BATCH_SIZE);

    if (resend) {
      const emails = batch.map((sub) => ({
        from: FROM_ADDRESS,
        to: sub.email,
        subject: campaign.subject,
        html: appendUnsubLink(campaign.htmlContent, sub.id),
      }));

      try {
        await resend.batch.send(emails);
        sentCount += batch.length;
      } catch (err) {
        console.error("[email-marketing] Batch илгээхэд алдаа:", err);
      }
    } else {
      for (const sub of batch) {
        console.log(
          `[email-marketing] (dry-run) Илгээх: ${sub.email} — ${campaign.subject}`
        );
      }
      sentCount += batch.length;
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENT",
      sentAt: new Date(),
      totalSent: sentCount,
    },
  });
}

export async function addSubscriber(
  listId: string,
  email: string,
  name?: string,
  tags?: string[]
) {
  const subscriber = await prisma.emailSubscriber.upsert({
    where: { listId_email: { listId, email } },
    update: {
      name: name ?? undefined,
      tags: tags ?? undefined,
      status: "ACTIVE",
    },
    create: {
      listId,
      email,
      name: name ?? null,
      tags: tags ?? [],
      status: "ACTIVE",
    },
  });

  return subscriber;
}

export async function importSubscribersCSV(
  listId: string,
  csvContent: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = Papa.parse<{ email?: string; name?: string }>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase(),
  });

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of result.data) {
    const email = row.email?.trim();
    if (!email) {
      errors.push(`Имэйл хоосон мөр алгассан`);
      continue;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Буруу имэйл формат: ${email}`);
      continue;
    }

    try {
      const existing = await prisma.emailSubscriber.findUnique({
        where: { listId_email: { listId, email } },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.emailSubscriber.create({
        data: {
          listId,
          email,
          name: row.name?.trim() || null,
          tags: [],
          status: "ACTIVE",
        },
      });
      imported++;
    } catch (err) {
      errors.push(`${email}: Алдаа гарлаа`);
    }
  }

  return { imported, skipped, errors };
}

export async function unsubscribeByToken(token: string): Promise<void> {
  const subscriberId = decodeUnsubToken(token);

  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { id: subscriberId },
  });

  if (!subscriber) {
    throw new Error("Захиалагч олдсонгүй");
  }

  await prisma.emailSubscriber.update({
    where: { id: subscriberId },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    },
  });
}
