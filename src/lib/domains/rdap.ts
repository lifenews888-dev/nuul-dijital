import {
  applyReservationOverlay,
  getInternallyReservedDomains,
  getTldPricingMap,
  resolveTlds,
  toSearchResult,
} from "@/lib/domains/pricing";
import { getCachedSearch, setCachedSearch } from "@/lib/domains/rdap-cache";
import { parseFqdn, sanitizeDomainLabel } from "@/lib/domains/sanitize";
import type { DomainAvailability, DomainSearchResponse, DomainSearchResult } from "@/lib/domains/types";

const RDAP_TIMEOUT_MS = 5000;

export type RdapLookupResult = {
  availability: Exclude<DomainAvailability, "RESERVED">;
  statusCode: number | null;
  latencyMs: number;
};

function rdapUrl(domain: string): string {
  return domain.endsWith(".mn")
    ? `https://rdap.registry.mn/domain/${domain}`
    : `https://rdap.org/domain/${domain}`;
}

/**
 * Query RDAP for a single FQDN.
 * UNKNOWN on network/timeout/unexpected status — never optimistic "available".
 */
export async function lookupRdap(domain: string): Promise<RdapLookupResult> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RDAP_TIMEOUT_MS);

    const res = await fetch(rdapUrl(domain), {
      signal: controller.signal,
      headers: { Accept: "application/rdap+json" },
      cache: "no-store",
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - started;

    if (res.status === 404 || res.status === 400) {
      return { availability: "AVAILABLE", statusCode: res.status, latencyMs };
    }
    if (res.ok) {
      return { availability: "TAKEN", statusCode: res.status, latencyMs };
    }

    return { availability: "UNKNOWN", statusCode: res.status, latencyMs };
  } catch {
    return { availability: "UNKNOWN", statusCode: null, latencyMs: Date.now() - started };
  }
}

/** Probe helper for GET /api/health/domains (PR 3). */
export async function probeRdap(testDomain = "nuul.digital"): Promise<{
  ok: boolean;
  latencyMs: number;
  rdapStatus: number | null;
  availability: DomainAvailability;
}> {
  const result = await lookupRdap(testDomain);
  return {
    ok: result.availability !== "UNKNOWN",
    latencyMs: result.latencyMs,
    rdapStatus: result.statusCode,
    availability: result.availability,
  };
}

export type SearchDomainsOptions = {
  tlds?: string[];
  /** Skip in-memory cache (e.g. order re-verify). */
  skipCache?: boolean;
  /** Skip DB reservation overlay. */
  skipReservations?: boolean;
};

/**
 * Full domain search: sanitize → cache → RDAP (parallel) → pricing → reservations.
 */
export async function searchDomains(
  query: string,
  options: SearchDomainsOptions = {}
): Promise<DomainSearchResponse | null> {
  const label = sanitizeDomainLabel(query);
  if (!label) return null;

  const started = Date.now();

  if (!options.skipCache) {
    const cached = getCachedSearch(label);
    if (cached) {
      return {
        query: label,
        results: cached,
        cached: true,
        latencyMs: Date.now() - started,
      };
    }
  }

  const [pricingMap, reserved] = await Promise.all([
    getTldPricingMap(),
    options.skipReservations ? Promise.resolve(new Set<string>()) : getInternallyReservedDomains(),
  ]);
  const tlds = resolveTlds(options.tlds, [...pricingMap.keys()]);

  const rdapResults = await Promise.all(
    tlds.map(async (tld) => {
      const domain = `${label}${tld}`;
      const lookup = await lookupRdap(domain);
      const pricing = pricingMap.get(tld);
      return toSearchResult(domain, tld, lookup.availability, pricing);
    })
  );

  const results = applyReservationOverlay(rdapResults, reserved);

  if (!options.skipCache) {
    setCachedSearch(label, results);
  }

  return {
    query: label,
    results,
    cached: false,
    latencyMs: Date.now() - started,
  };
}

/** Re-verify a single FQDN before order creation (no cache). */
export async function verifyDomainForOrder(
  fqdn: string
): Promise<{ ok: boolean; result: DomainSearchResult | null; reason?: string }> {
  const parsed = parseFqdn(fqdn);
  if (!parsed) {
    return { ok: false, result: null, reason: "INVALID_DOMAIN" };
  }

  const { label, tld } = parsed;
  const domain = `${label}${tld}`;
  const [lookup, pricingMap, reserved] = await Promise.all([
    lookupRdap(domain),
    getTldPricingMap(),
    getInternallyReservedDomains(),
  ]);

  let availability: DomainSearchResult["availability"] = lookup.availability;
  if (reserved.has(domain.toLowerCase())) {
    availability = "RESERVED";
  }

  const result = toSearchResult(domain, tld, availability, pricingMap.get(tld));

  if (result.availability === "TAKEN") {
    return { ok: false, result, reason: "DOMAIN_TAKEN" };
  }
  if (result.availability === "UNKNOWN") {
    return { ok: false, result, reason: "DOMAIN_UNKNOWN" };
  }
  if (result.availability === "RESERVED") {
    return { ok: false, result, reason: "DOMAIN_RESERVED" };
  }

  return { ok: true, result };
}