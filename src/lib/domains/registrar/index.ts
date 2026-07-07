import { manualRegistrarProvider } from "./manual";
import { resellerStubProvider } from "./reseller-stub";
import type { RegistrarProvider } from "./types";

export type { RegistrarProvider, RegistrarRegisterInput, RegistrarRegisterResult } from "./types";

const PROVIDERS: Record<string, RegistrarProvider> = {
  manual: manualRegistrarProvider,
  reseller: resellerStubProvider,
};

/** Resolve provider from env override or SiteSetting `domains_registrar_provider`. */
export async function getRegistrarProvider(): Promise<RegistrarProvider> {
  const envProvider = process.env.DOMAINS_REGISTRAR_PROVIDER?.trim().toLowerCase();
  if (envProvider && PROVIDERS[envProvider]) {
    return PROVIDERS[envProvider]!;
  }

  if (process.env.DATABASE_URL) {
    try {
      const { db } = await import("@/lib/db");
      const row = await db.siteSetting.findUnique({ where: { key: "domains_registrar_provider" } });
      const id = row?.value?.trim().toLowerCase() ?? "manual";
      return PROVIDERS[id] ?? manualRegistrarProvider;
    } catch {
      /* fall through */
    }
  }

  return manualRegistrarProvider;
}

export function listRegistrarProviders(): RegistrarProvider[] {
  return Object.values(PROVIDERS);
}