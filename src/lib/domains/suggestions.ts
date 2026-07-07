const PREFIXES = ["my", "get", "the", "go", "best", "top", "mn"];
const SUFFIXES = ["pro", "app", "digital", "online", "web", "mn", "store", "hub"];

/** Rule-based name suggestions when the primary .mn label is taken (Phase 1). */
export function generateDomainSuggestions(name: string): string[] {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  if (!clean) return [];

  const suggestions = new Set<string>();

  for (const prefix of PREFIXES) {
    if (!clean.startsWith(prefix)) suggestions.add(`${prefix}${clean}`);
  }

  for (const suffix of SUFFIXES) {
    if (!clean.endsWith(suffix)) {
      suggestions.add(`${clean}${suffix}`);
      suggestions.add(`${clean}-${suffix}`);
    }
  }

  if (clean.length > 5) suggestions.add(clean.slice(0, 5));

  return Array.from(suggestions).slice(0, 8);
}