import type {
  SupportMessageAuthor,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";

export type PublicTicketMessage = {
  id: string;
  authorKind: SupportMessageAuthor;
  body: string;
  createdAt: string;
  isOwn: boolean;
};

export type PublicTicketSummary = {
  id: string;
  number: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  slaPlanKey: string | null;
  slaDueAt: string | null;
  firstResponseAt: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type PublicTicketDetail = PublicTicketSummary & {
  messages: PublicTicketMessage[];
  domainOrderId: string | null;
  serviceOrderId: string | null;
};