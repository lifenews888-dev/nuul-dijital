"use server";

import type { DomainOrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { getSessionUser, optStr, requirePermission, str } from "@/lib/admin";
import { assertCan } from "@/lib/rbac";
import { db } from "@/lib/db";
import {
  canTransition,
  requiresManagePermission,
} from "@/lib/domains/order-status";
import { markServiceOrderPaid } from "@/lib/services/mark-paid";
async function resolveProvisionedById(): Promise<string | null> {
  const session = await getSessionUser();
  if (!session?.email || !process.env.DATABASE_URL) return null;
  try {
    const user = await db.user.findUnique({ where: { email: session.email }, select: { id: true } });
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function updateServiceOrderStatus(formData: FormData) {
  const user = await requirePermission("domains", "update");
  const id = str(formData, "id");
  const nextStatus = str(formData, "status") as DomainOrderStatus;

  const order = await db.serviceOrder.findUnique({
    where: { id },
    include: { payment: true },
  });

  if (!order) throw new Error("Захиалга олдсонгүй");

  if (!canTransition(order.status, nextStatus)) {
    throw new Error(`Төлөв шилжүүлэх боломжгүй: ${order.status} → ${nextStatus}`);
  }

  if (requiresManagePermission(nextStatus)) {
    assertCan(user.role, "domains", "manage");
  }

  const updateData: Prisma.ServiceOrderUpdateInput = { status: nextStatus };

  if (nextStatus === "COMPLETED") {
    updateData.provisionedAt = new Date();
    const provisionedById = await resolveProvisionedById();
    if (provisionedById) {
      updateData.provisionedBy = { connect: { id: provisionedById } };
    }

    const details: Record<string, string | number> = {};
    const cpanelUrl = optStr(formData, "cpanelUrl");
    const cpanelUser = optStr(formData, "cpanelUser");
    const mailboxCount = optStr(formData, "mailboxCount");
    if (cpanelUrl) details.cpanelUrl = cpanelUrl;
    if (cpanelUser) details.cpanelUser = cpanelUser;
    if (mailboxCount) details.mailboxCount = Number(mailboxCount);

    if (Object.keys(details).length > 0) {
      updateData.provisionDetails = details as Prisma.InputJsonValue;
    }
  }

  await db.serviceOrder.update({ where: { id }, data: updateData });

  await logActivity({
    action: "UPDATE",
    entity: "ServiceOrder",
    entityId: id,
    summary: `Төлөв: ${order.status} → ${nextStatus} (${order.orderNumber})`,
    metadata: {
      serviceType: order.serviceType,
      planKey: order.planKey,
      from: order.status,
      to: nextStatus,
    },
  });

  revalidatePath("/admin/services/orders");
  revalidatePath(`/admin/services/orders/${id}`);
  revalidatePath("/admin");
}

export async function saveServiceProvisionDetails(formData: FormData) {
  await requirePermission("domains", "update");
  const id = str(formData, "id");

  const cpanelUrl = optStr(formData, "cpanelUrl");
  const cpanelUser = optStr(formData, "cpanelUser");
  const mailboxCount = optStr(formData, "mailboxCount");
  const details: Record<string, string | number> = {};
  if (cpanelUrl) details.cpanelUrl = cpanelUrl;
  if (cpanelUser) details.cpanelUser = cpanelUser;
  if (mailboxCount) details.mailboxCount = Number(mailboxCount);

  await db.serviceOrder.update({
    where: { id },
    data: {
      adminNotes: optStr(formData, "adminNotes") ?? null,
      provisionDetails:
        Object.keys(details).length > 0 ? (details as Prisma.InputJsonValue) : undefined,
    },
  });

  await logActivity({
    action: "UPDATE",
    entity: "ServiceOrder",
    entityId: id,
    summary: "Үйлчилгээний тэмдэглэл хадгалагдлаа",
  });

  revalidatePath(`/admin/services/orders/${id}`);
}

export async function adminMarkServiceOrderPaid(formData: FormData) {
  const user = await requirePermission("domains", "update");
  const id = str(formData, "id");
  const transactionId = optStr(formData, "transactionId");

  const order = await db.serviceOrder.findUnique({
    where: { id },
    include: { payment: true },
  });

  if (!order) throw new Error("Захиалга олдсонгүй");
  if (order.status !== "PENDING_PAYMENT") {
    throw new Error("Зөвхөн төлбөр хүлээгдэж буй захиалгыг баталгаажуулна");
  }
  if (!order.payment || order.payment.status !== "PENDING") {
    throw new Error("Төлбөрийн мэдээлэл олдсонгүй эсвэл аль хэдийн төлөгдсөн");
  }

  const result = await markServiceOrderPaid(id, {
    transactionId: transactionId ?? `manual-${Date.now()}`,
    metadata: {
      markedBy: user.email ?? "admin",
      method: order.payment.method,
    },
  });

  if (!result) throw new Error("Төлбөр баталгаажуулахад алдаа гарлаа");

  revalidatePath("/admin/services/orders");
  revalidatePath(`/admin/services/orders/${id}`);
  revalidatePath("/admin");
}