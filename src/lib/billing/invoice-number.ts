import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const INVOICE_SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSuffix(length = 4): string {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += INVOICE_SUFFIX_CHARS[Math.floor(Math.random() * INVOICE_SUFFIX_CHARS.length)];
  }
  return suffix;
}

/** Format: INV-YYYYMMDD-XXXX */
export function formatInvoiceNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `INV-${y}${m}${d}-${randomSuffix(4)}`;
}

export async function generateUniqueInvoiceNumber(
  date = new Date(),
  tx: Prisma.TransactionClient = db
): Promise<string> {
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const number = formatInvoiceNumber(date);
    const existing = await tx.invoice.findUnique({ where: { number }, select: { id: true } });
    if (!existing) return number;
  }
  throw new Error("Could not generate unique invoice number");
}