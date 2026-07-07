import type { DomainSearchResult } from "@/lib/domains/types";

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  results: DomainSearchResult[];
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();

export function getCachedSearch(label: string): DomainSearchResult[] | null {
  const entry = cache.get(label);
  if (!entry) return null;
  if (Date.now() - entry.timestamp >= CACHE_TTL_MS) {
    cache.delete(label);
    return null;
  }
  return entry.results;
}

export function setCachedSearch(label: string, results: DomainSearchResult[]): void {
  cache.set(label, { results, timestamp: Date.now() });
}

/** Call after successful order creation so stale "available" rows refresh. */
export function invalidateSearchCache(label: string): void {
  cache.delete(label);
}

export function clearSearchCache(): void {
  cache.clear();
}