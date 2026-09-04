"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, str } from "@/lib/admin";
import {
  addStaffTicketMessage,
  assignTicket,
  setTicketStatus,
} from "@/lib/support/tickets";
import { ticketStatusSchema } from "@/lib/validations/support";

export async function setSupportTicketStatus(formData: FormData) {
  const user = await requirePermission("leads", "update");
  const id = str(formData, "id");
  const statusRaw = str(formData, "status");
  const parsed = ticketStatusSchema.safeParse(statusRaw);
  if (!id || !parsed.success) return;

  await setTicketStatus(id, parsed.data);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
}

export async function assignSupportTicket(formData: FormData) {
  await requirePermission("leads", "update");
  const id = str(formData, "id");
  const assignedToId = str(formData, "assignedToId") || null;
  if (!id) return;

  await assignTicket(id, assignedToId);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
}

export async function replySupportTicket(formData: FormData) {
  const user = await requirePermission("leads", "update");
  const id = str(formData, "id");
  const body = str(formData, "body");
  const isInternal = formData.get("isInternal") === "on";
  if (!id || !body) return;

  await addStaffTicketMessage(id, user.id!, body, isInternal);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
}