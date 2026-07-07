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
