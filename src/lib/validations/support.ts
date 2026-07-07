import { z } from "zod";

const ticketCategory = z.enum([
  "DOMAIN",
  "HOSTING",
  "EMAIL",
  "DNS",
  "SSL",
  "VPS",
  "BILLING",
  "WEBSITE",
  "OTHER",
]);

const ticketPriority = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  category: ticketCategory.default("OTHER"),
  priority: ticketPriority.default("NORMAL"),
  body: z.string().min(10).max(10_000),
  domainOrderId: z.string().cuid().optional(),
  serviceOrderId: z.string().cuid().optional(),
});

export const customerTicketMessageSchema = z.object({
  body: z.string().min(1).max(10_000),
});

export const staffTicketReplySchema = z.object({
  body: z.string().min(1).max(10_000),
  isInternal: z.boolean().default(false),
});

export const ticketStatusSchema = z.enum([
  "NEW",
  "ASSIGNED",
  "INVESTIGATING",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);

export const assignTicketSchema = z.object({
  assignedToId: z.string().cuid().nullable(),
});