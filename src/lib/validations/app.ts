import { z } from "zod";

export const appAuthRequestSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["mn", "en"]).optional(),
  callbackUrl: z.string().optional(),
});

export const appPasswordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const appSetPasswordSchema = z
  .object({
    token: z.string().min(10).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const appForgotPasswordSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["mn", "en"]).optional(),
});