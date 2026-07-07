import type { RegistrarProvider, RegistrarRegisterInput, RegistrarRegisterResult } from "./types";

function isResellerConfigured(): boolean {
  return Boolean(
    process.env.DOMAINS_RESELLER_API_URL?.trim() &&
      process.env.DOMAINS_RESELLER_API_KEY?.trim()
  );
}

/**
 * Placeholder for a future reseller/registrar API integration.
 * Returns NOT_IMPLEMENTED until a real HTTP client is wired.
 * Set DOMAINS_RESELLER_STUB_SUCCESS=true in dev to simulate a successful submit.
 */
export const resellerStubProvider: RegistrarProvider = {
  id: "reseller",
  label: "Reseller API (stub)",
  supportsAutoRegister: true,

  async register(input: RegistrarRegisterInput): Promise<RegistrarRegisterResult> {
    if (!isResellerConfigured()) {
      return {
        ok: false,
        code: "NOT_CONFIGURED",
        message: "DOMAINS_RESELLER_API_URL / DOMAINS_RESELLER_API_KEY тохируулагдаагүй байна.",
        retryable: false,
      };
    }

    if (process.env.DOMAINS_RESELLER_STUB_SUCCESS === "true") {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + input.years);
      return {
        ok: true,
        registrarName: "reseller-stub",
        registrarOrderId: `RS-${input.orderNumber}`,
        expiresAt,
        pending: true,
      };
    }

    console.info("[registrar/reseller-stub] register skipped (not implemented):", {
      orderNumber: input.orderNumber,
      domain: input.domainName,
    });

    return {
      ok: false,
      code: "NOT_IMPLEMENTED",
      message: "Reseller API холболт хараахан хэрэгжээгүй байна.",
      retryable: true,
    };
  },
};