import { z } from "zod";

export const orderLookupRequestSchema = z.object({
  email: z.string().email().max(254),
  locale: z.enum(["mn", "en"]).optional(),
});