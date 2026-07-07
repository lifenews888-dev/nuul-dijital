import { z } from "zod";

/** Mongolia mobile/landline — normalizes to +976XXXXXXXX */
export const phoneMnSchema = z
  .string()
  .min(8)
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+?976)?\d{8}$/.test(v), {
    message: "Утасны дугаар буруу байна (8 орон эсвэл +976...)",
  })
  .transform((v) => (v.startsWith("+976") ? v : v.startsWith("976") ? `+${v}` : `+976${v}`));