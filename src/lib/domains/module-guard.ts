import { NextResponse } from "next/server";
import { getSiteFlag } from "@/lib/settings";

/** Returns 503 Response if domains module disabled; null to proceed. */
export async function requireDomainsModule(): Promise<NextResponse | null> {
  const enabled = await getSiteFlag("domains_module_enabled", "false");
  if (!enabled) {
    return NextResponse.json(
      { error: "Domains module disabled", code: "DOMAINS_DISABLED" },
      { status: 503 }
    );
  }
  return null;
}

/** Returns 503 when hosting/email live checkout is disabled. */
export async function requireServiceOrdersEnabled(): Promise<NextResponse | null> {
  if (process.env.DOMAINS_SERVICE_ORDERS_ENABLED === "true") return null;
  const enabled = await getSiteFlag("domains_service_orders_enabled", "false");
  if (!enabled) {
    return NextResponse.json(
      { error: "Service orders disabled", code: "SERVICE_ORDERS_DISABLED" },
      { status: 503 }
    );
  }
  return null;
}

/** Returns null when auto-registration is enabled; used by health/diagnostics only. */
export async function isAutoRegisterEnabled(): Promise<boolean> {
  const enabled = await getSiteFlag("domains_auto_register_enabled", "false");
  return enabled;
}

/** Returns 503 when AI domain suggestions are disabled via SiteSetting. */
export async function requireAiSuggestEnabled(): Promise<NextResponse | null> {
  const enabled = await getSiteFlag("domains_ai_suggest_enabled", "false");
  if (!enabled) {
    return NextResponse.json(
      { error: "AI domain suggestions disabled", code: "AI_SUGGEST_DISABLED" },
      { status: 503 }
    );
  }
  return null;
}