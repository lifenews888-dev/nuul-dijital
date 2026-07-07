import type { RegistrarProvider, RegistrarRegisterInput, RegistrarRegisterResult } from "./types";

/** Default provider — admin fulfills at registry.mn manually. */
export const manualRegistrarProvider: RegistrarProvider = {
  id: "manual",
  label: "Гараар (registry.mn)",
  supportsAutoRegister: false,

  async register(_input: RegistrarRegisterInput): Promise<RegistrarRegisterResult> {
    return {
      ok: false,
      code: "MANUAL_REQUIRED",
      message: "Автомат бүртгэл идэвхгүй — админ гараар registrar дээр бүртгэнэ.",
      retryable: false,
    };
  },
};