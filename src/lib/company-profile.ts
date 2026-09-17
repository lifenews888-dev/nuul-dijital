import { db } from "@/lib/db";

/**
 * Legal identity for documents that leave the building — quotations above all.
 *
 * A corporate or state-adjacent buyer checks who they are contracting with
 * before they check the price, so a quotation without a registration number
 * reads as unserious. These live in SiteSetting rather than in code so an admin
 * can correct them without a deploy.
 *
 * Deliberately no placeholder fallbacks. An invented registration number on a
 * quotation is worse than a missing one: the buyer can verify it, and a wrong
 * one is a reason to stop trusting the rest of the document. Empty means unset,
 * and the quotation simply leaves that line out.
 */
export type CompanyProfile = {
  /** ТТД — state registration number */
  regNumber: string;
  /** НӨАТ төлөгчийн дугаар — VAT registration */
  vatNumber: string;
  /** Legal entity name as it appears on contracts, if it differs from the brand */
  legalName: string;
  /** How many days a quotation stays valid */
  quoteValidDays: number;
};

const KEYS = [
  "companyRegNumber",
  "companyVatNumber",
  "companyLegalName",
  "quoteValidDays",
] as const;

export const EMPTY_PROFILE: CompanyProfile = {
  regNumber: "",
  vatNumber: "",
  legalName: "",
  quoteValidDays: 14,
};

export async function getCompanyProfile(): Promise<CompanyProfile> {
  if (!process.env.DATABASE_URL) return EMPTY_PROFILE;
  try {
    const rows = await db.siteSetting.findMany({ where: { key: { in: [...KEYS] } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const days = Number.parseInt(map.quoteValidDays ?? "", 10);
    return {
      regNumber: map.companyRegNumber?.trim() || "",
      vatNumber: map.companyVatNumber?.trim() || "",
      legalName: map.companyLegalName?.trim() || "",
      quoteValidDays: Number.isFinite(days) && days > 0 ? days : EMPTY_PROFILE.quoteValidDays,
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

/** True when the profile carries enough to head a quotation the buyer can verify. */
export function isProfileComplete(p: CompanyProfile): boolean {
  return Boolean(p.regNumber && p.legalName);
}
