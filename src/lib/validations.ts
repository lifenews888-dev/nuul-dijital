import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(5),
});

export const quoteSchema = z.object({
  services: z.array(z.string()).min(1),
  budget: z.string().min(1),
  timeline: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  details: z.string().optional(),
});

export const subscribeSchema = z.object({
  email: z.string().email(),
});

export const meetingSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  preferredAt: z.string().min(2),
  topic: z.string().optional(),
  message: z.string().optional(),
});

export const briefSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email(),
  company: z.string().optional(),
  location: z.string().optional(),
  social: z.string().optional(),
  services: z.array(z.string()).default([]),
  projectTypes: z.array(z.string()).default([]),
  domainStatus: z.string().optional(),
  domainName: z.string().optional(),
  hosting: z.boolean().nullable().optional(),
  hasLogo: z.boolean().nullable().optional(),
  about: z.string().optional(),
  goal: z.string().optional(),
  audience: z.string().optional(),
  colors: z.string().optional(),
  pages: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  needsAuth: z.boolean().nullable().optional(),
  references: z.array(z.string()).default([]),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
  journeyId: z.string().cuid().optional(),
});

export const serviceWaitlistSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).optional(),
  service: z.enum(["hosting", "email", "ssl"]),
  plan: z.string().optional(),
  journeyId: z.string().cuid().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type BriefInput = z.infer<typeof briefSchema>;

/** Treats an empty form value as "not answered" before an enum sees it. */
function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((v) => (v === "" ? undefined : v), schema.optional());
}

export const softwareQuoteSchema = z.object({
  company: z.string().min(2),
  regNumber: z.string().optional(),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  vendor: z.string().optional(),
  products: z.string().min(2),
  /* Coercion turns "" into 0, which then fails .positive() -- so leaving this
     optional field blank rejected the entire enquiry with a 400. */
  seats: emptyToUndefined(z.coerce.number().int().positive()),
  term: z.string().optional(),
  message: z.string().optional(),
  /* Intake detail. Optional so an enquiry is never blocked on them, but each
     one saves a round trip: a renewal without its licence numbers, or a tender
     mistaken for a direct sale, costs another email either way. */
  /* An unselected <select> posts "" rather than omitting itself, and "" is not
     a member of these enums, so without this the whole submission would 400 on
     a field nobody had to fill in. */
  purchaseType: emptyToUndefined(z.enum(["NEW", "RENEWAL", "BOTH"])),
  existingLicense: z.string().optional(),
  position: z.string().optional(),
  neededBy: z.string().optional(),
  procurement: emptyToUndefined(z.enum(["DIRECT", "TENDER", "RESEARCH"])),
  /** Honeypot — accepted by the schema so the route can drop bots quietly. */
  website: z.string().optional(),
});

export type SoftwareQuoteInput = z.infer<typeof softwareQuoteSchema>;
