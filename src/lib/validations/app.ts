import { z } from "zod";

export const appAuthRequestSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["mn", "en"]).optional(),
});