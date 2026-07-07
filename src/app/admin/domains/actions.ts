"use server";

import type { DomainOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { bool, getSessionUser, num, optStr, requirePermission, str } from "@/lib/admin";
import { assertCan } from "@/lib/rbac";
import { db } from "@/lib/db";
import { tldProductSchema } from "@/lib/validations/domains";
import {
  sendDomainCompletedEmail,
  sendFulfillmentStartedEmail,
} from "@/lib/domains/fulfillment-emails";
import { markOrderPaid } from "@/lib/domains/mark-paid";
import {
  canTransition,
  requiresManagePermission,
} from "@/lib/domains/order-status";

async function resolveFulfilledById(): Promise<string | null> {
  const session = await getSessionUser();
  if (!session?.email || !process.env.DATABASE_URL) return null;
  try {
    const user = await db.user.findUnique({ where: { email: session.email }, select: { id: true } });
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function updateDomainOrderStatus(formData: FormData) {
  const user = await requirePermission("domains", "update");
  const id = str(formData, "id");
  const nextStatus = str(formData, "status") as DomainOrderStatus;

  const order = await db.domainOrder.findUnique({
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

  if (nextStatus === "COMPLETED" && !order.registrantVerified) {
    throw new Error(
      "Бүртгэлийн бичиг баримт баталгаажаагүй байна. Эхлээд 'Бичиг баримт баталгаажуулах' товчийг дарна уу."
    );
  }

  const updateData: {
    status: DomainOrderStatus;
    fulfilledAt?: Date;
    fulfilledById?: string | null;
    registrarName?: string | null;
    registrarOrderId?: string | null;
    domainExpiresAt?: Date | null;
  } = { status: nextStatus };

  if (nextStatus === "COMPLETED") {
    updateData.fulfilledAt = new Date();
    updateData.fulfilledById = await resolveFulfilledById();
    updateData.registrarName = optStr(formData, "registrarName") ?? order.registrarName;
    updateData.registrarOrderId = optStr(formData, "registrarOrderId") ?? order.registrarOrderId;
    const expiresRaw = optStr(formData, "domainExpiresAt");
    if (expiresRaw) {
      updateData.domainExpiresAt = new Date(expiresRaw);
    } else if (!order.domainExpiresAt) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + order.years);
      updateData.domainExpiresAt = expires;
    }
  }

  await db.domainOrder.update({ where: { id }, data: updateData });

  if (nextStatus === "FULFILLING") {
    await sendFulfillmentStartedEmail(order);
  }

  if (nextStatus === "COMPLETED") {
    await sendDomainCompletedEmail({
      ...order,
      registrarName: updateData.registrarName ?? order.registrarName,
      domainExpiresAt: updateData.domainExpiresAt ?? order.domainExpiresAt,
    });
  }

  await logActivity({
    action: "UPDATE",
    entity: "DomainOrder",
    entityId: id,
    summary: `Төлөв: ${order.status} → ${nextStatus} (${order.orderNumber})`,
    metadata: { domain: order.domainName, from: order.status, to: nextStatus },
  });

  revalidatePath("/admin/domains/orders");
  revalidatePath(`/admin/domains/orders/${id}`);
  revalidatePath("/admin");
}

export async function verifyRegistrant(formData: FormData) {
  await requirePermission("domains", "update");
  const id = str(formData, "id");

  const order = await db.domainOrder.findUnique({ where: { id } });
  if (!order) throw new Error("Захиалга олдсонгүй");

  if (!["PAID", "FULFILLING", "PENDING_PAYMENT"].includes(order.status)) {
    throw new Error("Энэ төлөвт бичиг баримт баталгаажуулах боломжгүй");
  }

  await db.domainOrder.update({
    where: { id },
    data: { registrantVerified: true },
  });

  await logActivity({
    action: "UPDATE",
    entity: "DomainOrder",
    entityId: id,
    summary: `Бүртгэлийн бичиг баримт баталгаажлаа: ${order.orderNumber}`,
    metadata: { domain: order.domainName },
  });

  revalidatePath("/admin/domains/orders");
  revalidatePath(`/admin/domains/orders/${id}`);
}

export async function saveFulfillmentDetails(formData: FormData) {
  await requirePermission("domains", "update");
  const id = str(formData, "id");
  const expiresRaw = optStr(formData, "domainExpiresAt");

  await db.domainOrder.update({
    where: { id },
    data: {
      adminNotes: optStr(formData, "adminNotes") ?? null,
      registrarName: optStr(formData, "registrarName") ?? null,
      registrarOrderId: optStr(formData, "registrarOrderId") ?? null,
      domainExpiresAt: expiresRaw ? new Date(expiresRaw) : undefined,
    },
  });

  await logActivity({
    action: "UPDATE",
    entity: "DomainOrder",
    entityId: id,
    summary: "Бүртгэлийн тэмдэглэл хадгалагдлаа",
  });

  revalidatePath(`/admin/domains/orders/${id}`);
}

/** Confirm bank transfer (or manual) payment — calls shared markOrderPaid(). */
export async function adminMarkOrderPaid(formData: FormData) {
  const user = await requirePermission("domains", "update");
  const id = str(formData, "id");
  const transactionId = optStr(formData, "transactionId");

  const order = await db.domainOrder.findUnique({
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

  const result = await markOrderPaid(id, {
    transactionId: transactionId ?? `manual-${Date.now()}`,
    metadata: {
      markedBy: user.email ?? "admin",
      method: order.payment.method,
    },
  });

  if (!result) throw new Error("Төлбөр баталгаажуулахад алдаа гарлаа");

  revalidatePath("/admin/domains/orders");
  revalidatePath(`/admin/domains/orders/${id}`);
  revalidatePath("/admin");
}

function parseTldProductForm(formData: FormData) {
  const transferRaw = str(formData, "transferPrice");
  return tldProductSchema.safeParse({
    tld: str(formData, "tld"),
    labelMn: str(formData, "labelMn"),
    labelEn: str(formData, "labelEn"),
    registerPrice: num(formData, "registerPrice"),
    renewPrice: num(formData, "renewPrice"),
    transferPrice: transferRaw ? num(formData, "transferPrice") : null,
    minYears: num(formData, "minYears", 1),
    maxYears: num(formData, "maxYears", 5),
    featured: bool(formData, "featured"),
    sortOrder: num(formData, "sortOrder"),
    status: (str(formData, "status") || "ACTIVE") as "ACTIVE" | "DISABLED",
  });
}

export async function saveTldProduct(formData: FormData) {
  await requirePermission("domains", "manage");
  const id = optStr(formData, "id");
  const parsed = parseTldProductForm(formData);

  if (!parsed.success) {
    throw new Error("Буруу өгөгдөл. TLD, үнэ, жилийн хязгаарыг шалгана уу.");
  }

  const data = parsed.data;

  if (id) {
    const existing = await db.tldProduct.findUnique({ where: { id } });
    if (!existing) throw new Error("TLD олдсонгүй");

    const saved = await db.tldProduct.update({
      where: { id },
      data: {
        labelMn: data.labelMn,
        labelEn: data.labelEn,
        registerPrice: data.registerPrice,
        renewPrice: data.renewPrice,
        transferPrice: data.transferPrice ?? null,
        minYears: data.minYears,
        maxYears: data.maxYears,
        featured: data.featured,
        sortOrder: data.sortOrder,
        status: data.status,
      },
    });

    await logActivity({
      action: "UPDATE",
      entity: "TldProduct",
      entityId: saved.id,
      summary: `TLD үнэ шинэчлэгдлээ: ${saved.tld}`,
      metadata: { registerPrice: saved.registerPrice, status: saved.status },
    });
  } else {
    const duplicate = await db.tldProduct.findUnique({ where: { tld: data.tld } });
    if (duplicate) throw new Error(`${data.tld} TLD аль хэдийн бүртгэгдсэн байна`);

    const saved = await db.tldProduct.create({ data });

    await logActivity({
      action: "CREATE",
      entity: "TldProduct",
      entityId: saved.id,
      summary: `Шинэ TLD нэмэгдлээ: ${saved.tld}`,
      metadata: { registerPrice: saved.registerPrice },
    });
  }

  revalidatePath("/admin/domains/pricing");
  if (id) revalidatePath(`/admin/domains/pricing/${id}`);
}

export async function deleteTldProduct(formData: FormData) {
  await requirePermission("domains", "manage");
  const id = str(formData, "id");

  const product = await db.tldProduct.findUnique({ where: { id } });
  if (!product) throw new Error("TLD олдсонгүй");

  const orderCount = await db.domainOrder.count({ where: { tldProductId: id } });

  if (orderCount > 0) {
    await db.tldProduct.update({
      where: { id },
      data: { status: "DISABLED" },
    });
    await logActivity({
      action: "UPDATE",
      entity: "TldProduct",
      entityId: id,
      summary: `TLD идэвхгүй болгосон (${product.tld}) — ${orderCount} захиалга холбоотой`,
    });
  } else {
    await db.tldProduct.delete({ where: { id } });
    await logActivity({
      action: "DELETE",
      entity: "TldProduct",
      entityId: id,
      summary: `TLD устгагдлаа: ${product.tld}`,
    });
  }

  revalidatePath("/admin/domains/pricing");
}