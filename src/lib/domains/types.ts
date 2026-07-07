/** RDAP / registry lookup outcome for a single FQDN. */
export type DomainAvailability = "AVAILABLE" | "TAKEN" | "UNKNOWN" | "RESERVED";

export type DomainSearchResult = {
  domain: string;
  tld: string;
  /** Legacy boolean — true only when availability is AVAILABLE. */
  available: boolean;
  availability: DomainAvailability;
  price: number;
  renewPrice: number;
  currency: "MNT";
  purchasable: boolean;
};

export type DomainSearchResponse = {
  query: string;
  results: DomainSearchResult[];
  cached: boolean;
  latencyMs: number;
};

export const DEFAULT_TLDS = [".mn", ".com", ".org", ".net", ".shop"] as const;

export type DefaultTld = (typeof DEFAULT_TLDS)[number];