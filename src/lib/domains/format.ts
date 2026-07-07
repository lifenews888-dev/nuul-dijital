/** Format MNT price for display (e.g. 45,000₮). */
export function formatDomainPrice(amount: number, locale = "mn"): string {
  const formatted = amount.toLocaleString(locale === "en" ? "en-US" : "mn-MN");
  return `${formatted}₮`;
}