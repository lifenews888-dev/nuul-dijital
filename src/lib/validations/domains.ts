import { z } from "zod";
import { parseFqdn } from "@/lib/domains/sanitize";
import { phoneMnSchema } from "@/lib/validations/phone";

const tldSchema = z
  .string()
  .regex(/^\.\w{2,24}$/, "TLD must start with . (e.g. .mn)");

export const domainSearchSchema = z.object({
  query: z.string().min(2).max(63),
  tlds: z.array(tldSchema).optional(),
  journeyId: z.string().cuid().optional(),
});

export const domainSuggestSchema = z.object({
  text: z.string().min(3).max(500),
  locale: z.enum(["mn", "en"]).optional(),
  tlds: z.array(tldSchema).max(3).optional(),
  journeyId: z.string().cuid().optional(),
});

export const tldProductSchema = z
  .object({
    tld: z
      .string()
      .min(3)
      .max(25)
      .transform((v) => (v.startsWith(".") ? v.toLowerCase() : `.${v.toLowerCase()}`))
      .pipe(tldSchema),
    labelMn: z.string().min(1).max(100),
    labelEn: z.string().min(1).max(100),
    registerPrice: z.number().int().min(1000).max(10_000_000),
    renewPrice: z.number().int().min(1000).max(10_000_000),
    transferPrice: z.number().int().min(1000).max(10_000_000).nullable().optional(),
    minYears: z.number().int().min(1).max(10).default(1),
    maxYears: z.number().int().min(1).max(10).default(5),
    featured: z.boolean().default(false),
    sortOrder: z.number().int().min(0).max(999).default(0),
    status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE"),
  })
  .superRefine((data, ctx) => {
    if (data.maxYears < data.minYears) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "maxYears must be >= minYears",
        path: ["maxYears"],
      });
    }
  });

export const domainOrderSchema = z
  .object({
    domain: z
      .string()
      .min(4)
      .max(253)
      .refine((d) => parseFqdn(d) !== null, { message: "Домэйн нэр буруу байна" }),
    years: z.number().int().min(1).max(10).default(1),
    customerName: z.string().min(2).max(100),
    customerEmail: z.string().email(),
    customerPhone: phoneMnSchema,
    company: z.string().max(200).optional(),
    registrantType: z.enum(["INDIVIDUAL", "BUSINESS"]).default("INDIVIDUAL"),
    registrantAddress: z.string().min(5).max(500),
    registrantIdType: z.string().max(50).optional(),
    registrantIdNumber: z.string().max(50).optional(),
    businessRegNumber: z.string().max(50).optional(),
    paymentMethod: z.enum(["QPAY", "BANK_TRANSFER"]).default("QPAY"),
    journeyId: z.string().cuid().optional(),
    locale: z.enum(["mn", "en"]).optional(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү" }) }),
    acceptRegistryPolicy: z.literal(true, {
      errorMap: () => ({ message: "Домэйн бүртгэлийн нөхцөлийг зөвшөөрнө үү" }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.registrantType === "BUSINESS") {
      if (!data.company?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Байгууллагын нэр заавал",
          path: ["company"],
        });
      }
      if (!data.businessRegNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Байгууллагын регистрийн дугаар заавал",
          path: ["businessRegNumber"],
        });
      }
    }
    if (data.registrantType === "INDIVIDUAL" && !data.registrantIdNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Регистрийн дугаар заавал",
        path: ["registrantIdNumber"],
      });
    }
  });

export const domainRenewalSchema = z.object({
  sourceOrderId: z.string().cuid(),
  years: z.number().int().min(1).max(10).default(1),
  paymentMethod: z.enum(["QPAY", "BANK_TRANSFER"]).default("QPAY"),
  locale: z.enum(["mn", "en"]).optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү" }),
  }),
});

export type DomainSearchInput = z.infer<typeof domainSearchSchema>;
export type DomainSuggestInput = z.infer<typeof domainSuggestSchema>;
export type DomainOrderInput = z.infer<typeof domainOrderSchema>;
export type TldProductInput = z.infer<typeof tldProductSchema>;