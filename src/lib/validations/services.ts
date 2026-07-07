import { z } from "zod";
import { phoneMnSchema } from "@/lib/validations/phone";

export const serviceOrderSchema = z.object({
  serviceType: z.enum(["HOSTING", "EMAIL"]),
  planKey: z.string().min(1).max(32),
  domainName: z
    .string()
    .max(253)
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed || undefined;
    }),
  billingMonths: z.number().int().min(1).max(12).default(1),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: phoneMnSchema,
  company: z.string().max(200).optional(),
  paymentMethod: z.enum(["QPAY", "BANK_TRANSFER"]).default("QPAY"),
  journeyId: z.string().cuid().optional(),
  locale: z.enum(["mn", "en"]).optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү" }),
  }),
}).superRefine((data, ctx) => {
  if (data.domainName && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(data.domainName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Домэйн нэр буруу байна",
      path: ["domainName"],
    });
  }
});

export type ServiceOrderInput = z.infer<typeof serviceOrderSchema>;