import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 4): string {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }
  return suffix;
}

/** Format: ST-YYYYMMDD-XXXX */
export function formatTicketNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ST-${y}${m}${d}-${randomSuffix(4)}`;
}

export async function generateUniqueTicketNumber(
  date = new Date(),
  tx: Prisma.TransactionClient = db
): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const number = formatTicketNumber(date);
    const existing = await tx.supportTicket.findUnique({ where: { number }, select: { id: true } });
    if (!existing) return number;
  }
  throw new Error("Could not generate unique ticket number");
}