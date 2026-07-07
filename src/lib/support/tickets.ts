import type {
  SupportMessageAuthor,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { computeSlaDueAt, resolveOrgSlaPlan } from "@/lib/support/sla";
import { generateUniqueTicketNumber } from "@/lib/support/ticket-number";
import type { PublicTicketDetail, PublicTicketMessage, PublicTicketSummary } from "@/lib/support/types";

type TicketRow = {
  id: string;
  number: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  slaPlanKey: string | null;
  slaDueAt: Date | null;
  firstResponseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  domainOrderId: string | null;
  serviceOrderId: string | null;
  _count: { messages: number };
};

type MessageRow = {
  id: string;
  authorKind: SupportMessageAuthor;
  body: string;
  createdAt: Date;
  authorUserId: string | null;
  isInternal: boolean;
};

function toSummary(row: TicketRow): PublicTicketSummary {
  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: row.status,
    slaPlanKey: row.slaPlanKey,
    slaDueAt: row.slaDueAt?.toISOString() ?? null,
    firstResponseAt: row.firstResponseAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    messageCount: row._count.messages,
  };
}

function toPublicMessage(row: MessageRow, viewerUserId: string): PublicTicketMessage {
  return {
    id: row.id,
    authorKind: row.authorKind,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    isOwn: row.authorKind === "CUSTOMER" && row.authorUserId === viewerUserId,
  };
}

export async function listOrgTickets(orgId: string): Promise<PublicTicketSummary[]> {
  const rows = await db.supportTicket.findMany({
    where: { orgId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return rows.map(toSummary);
}

export async function getOrgTicketDetail(
  orgId: string,
  ticketId: string,
  viewerUserId: string
): Promise<PublicTicketDetail | null> {
  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, orgId },
    include: {
      _count: { select: { messages: true } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) return null;

  return {
    ...toSummary(ticket),
    domainOrderId: ticket.domainOrderId,
    serviceOrderId: ticket.serviceOrderId,
    messages: ticket.messages.map((m) => toPublicMessage(m, viewerUserId)),
  };
}

export type CreateTicketInput = {
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  body: string;
  domainOrderId?: string;
  serviceOrderId?: string;
};

export async function createSupportTicket(
  orgId: string,
  userId: string,
  input: CreateTicketInput
): Promise<PublicTicketDetail> {
  const { planKey, slaMinutes } = await resolveOrgSlaPlan(orgId);
  const slaDueAt = computeSlaDueAt(slaMinutes);

  const ticket = await db.$transaction(async (tx) => {
    const number = await generateUniqueTicketNumber(new Date(), tx);
    const created = await tx.supportTicket.create({
      data: {
        number,
        orgId,
        userId,
        subject: input.subject,
        category: input.category,
        priority: input.priority,
        slaPlanKey: planKey,
        slaDueAt,
        domainOrderId: input.domainOrderId,
        serviceOrderId: input.serviceOrderId,
        messages: {
          create: {
            authorUserId: userId,
            authorKind: "CUSTOMER",
            body: input.body,
          },
        },
      },
      include: {
        _count: { select: { messages: true } },
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return created;
  });

  return {
    ...toSummary(ticket),
    domainOrderId: ticket.domainOrderId,
    serviceOrderId: ticket.serviceOrderId,
    messages: ticket.messages.map((m) => toPublicMessage(m, userId)),
  };
}

export async function addCustomerTicketMessage(
  orgId: string,
  ticketId: string,
  userId: string,
  body: string
): Promise<PublicTicketDetail | null> {
  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, orgId },
    select: { id: true, status: true },
  });
  if (!ticket) return null;
  if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
    throw new Error("TICKET_CLOSED");
  }

  await db.$transaction(async (tx) => {
    await tx.supportTicketMessage.create({
      data: {
        ticketId,
        authorUserId: userId,
        authorKind: "CUSTOMER",
        body,
      },
    });
    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: ticket.status === "WAITING_CUSTOMER" ? "ASSIGNED" : ticket.status,
        updatedAt: new Date(),
      },
    });
  });

  return getOrgTicketDetail(orgId, ticketId, userId);
}

// --- Admin helpers ---

export type AdminTicketRow = {
  id: string;
  number: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  slaPlanKey: string | null;
  slaDueAt: Date | null;
  firstResponseAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organization: { id: string; name: string; slug: string };
  user: { id: string; name: string | null; email: string };
  assignedTo: { id: string; name: string | null; email: string } | null;
  _count: { messages: number };
};

export async function listAdminTickets(status?: SupportTicketStatus): Promise<AdminTicketRow[]> {
  return db.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { slaDueAt: "asc" }, { createdAt: "desc" }],
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });
}

export type AdminTicketDetail = AdminTicketRow & {
  domainOrderId: string | null;
  serviceOrderId: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  messages: Array<{
    id: string;
    authorKind: SupportMessageAuthor;
    body: string;
    isInternal: boolean;
    createdAt: Date;
    authorUser: { id: string; name: string | null; email: string } | null;
  }>;
};

export async function getAdminTicketDetail(ticketId: string): Promise<AdminTicketDetail | null> {
  return db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          authorUser: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export async function setTicketStatus(
  ticketId: string,
  status: SupportTicketStatus
): Promise<void> {
  const now = new Date();
  const data: {
    status: SupportTicketStatus;
    resolvedAt?: Date | null;
    closedAt?: Date | null;
  } = { status };

  if (status === "RESOLVED") data.resolvedAt = now;
  if (status === "CLOSED") data.closedAt = now;
  if (status !== "RESOLVED") data.resolvedAt = null;
  if (status !== "CLOSED") data.closedAt = null;

  await db.supportTicket.update({ where: { id: ticketId }, data });
}

export async function assignTicket(
  ticketId: string,
  assignedToId: string | null
): Promise<void> {
  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedToId,
      status: assignedToId ? "ASSIGNED" : undefined,
    },
  });
}

export async function addStaffTicketMessage(
  ticketId: string,
  staffUserId: string,
  body: string,
  isInternal: boolean
): Promise<void> {
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, firstResponseAt: true, status: true },
  });
  if (!ticket) throw new Error("NOT_FOUND");

  const now = new Date();
  const isFirstPublicStaffReply = !ticket.firstResponseAt && !isInternal;

  await db.$transaction(async (tx) => {
    await tx.supportTicketMessage.create({
      data: {
        ticketId,
        authorUserId: staffUserId,
        authorKind: "STAFF",
        body,
        isInternal,
      },
    });

    const updates: {
      firstResponseAt?: Date;
      status?: SupportTicketStatus;
      updatedAt: Date;
    } = { updatedAt: now };

    if (isFirstPublicStaffReply) {
      updates.firstResponseAt = now;
    }
    if (!isInternal) {
      updates.status = "WAITING_CUSTOMER";
    } else if (ticket.status === "NEW") {
      updates.status = "INVESTIGATING";
    }

    await tx.supportTicket.update({
      where: { id: ticketId },
      data: updates,
    });
  });
}

export async function listStaffAssignees(): Promise<
  Array<{ id: string; name: string | null; email: string }>
> {
  return db.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}