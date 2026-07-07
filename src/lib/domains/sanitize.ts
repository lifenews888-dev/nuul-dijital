const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Normalizes a domain label (no TLD): lowercase, strips invalid chars and trailing TLD if pasted.
 * Returns null when the label is too short or invalid.
 */
export function sanitizeDomainLabel(input: string): string | null {
  const clean = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/\.[^.]+$/, "")
    .replace(/^-+|-+$/g, "");

  if (!clean || clean.length < 2 || clean.length > 63) return null;
  if (!LABEL_RE.test(clean)) return null;
  return clean;
}

/** Parses `kingwash.mn` into label + `.mn` TLD. */
export function parseFqdn(fqdn: string): { label: string; tld: string } | null {
  const normalized = fqdn.toLowerCase().trim();
  const dot = normalized.lastIndexOf(".");
  if (dot <= 0 || dot === normalized.length - 1) return null;

  const label = normalized.slice(0, dot);
  const tld = normalized.slice(dot);
  const cleanLabel = sanitizeDomainLabel(label);
  if (!cleanLabel) return null;

  return { label: cleanLabel, tld };
}

export function isValidDomainLabel(label: string): boolean {
  return sanitizeDomainLabel(label) !== null;
}