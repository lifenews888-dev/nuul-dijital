import { db } from "@/lib/db";

export type BankSettings = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIban: string;
};

const KEYS = ["bankName", "bankAccountName", "bankAccountNumber", "bankIban"] as const;

const FALLBACK: BankSettings = {
  bankName: "Хаан банк",
  bankAccountName: "Nuul Digital LLC",
  bankAccountNumber: "5000000000",
  bankIban: "MN00 0000 0000 0000 0000",
};

/** Bank transfer details from SiteSetting (admin-editable). */
export async function getBankSettings(): Promise<BankSettings> {
  if (!process.env.DATABASE_URL) return FALLBACK;

  try {
    const rows = await db.siteSetting.findMany({
      where: { key: { in: [...KEYS] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      bankName: map.bankName || FALLBACK.bankName,
      bankAccountName: map.bankAccountName || FALLBACK.bankAccountName,
      bankAccountNumber: map.bankAccountNumber || FALLBACK.bankAccountNumber,
      bankIban: map.bankIban || FALLBACK.bankIban,
    };
  } catch {
    return FALLBACK;
  }
}

export function isBankConfigured(settings: BankSettings): boolean {
  return Boolean(settings.bankAccountNumber?.trim() && settings.bankAccountName?.trim());
}