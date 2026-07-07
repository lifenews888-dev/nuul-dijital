import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ServiceOrderFulfillment } from "@/components/admin/service-order-fulfillment";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { getSessionUser, requirePermission, safe } from "@/lib/admin";
import { can } from "@/lib/rbac";
import { formatDomainPrice } from "@/lib/domains/format";
import { DOMAIN_ORDER_STATUS_LABELS } from "@/lib/domains/order-status";
import {
  PLAN_KEY_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/services/order-status";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Хүлээгдэж буй",
  PROCESSING: "Боловсруулж байна",
  COMPLETED: "Төлөгдсөн",
  FAILED: "Амжилтгүй",
  EXPIRED: "Хугацаа дууссан",
  REFUNDED: "Буцаагдсан",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === "" || children === "—") return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

export default async function AdminServiceOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("domains", "read");
  const user = await getSessionUser();
  const canManage = can(user?.role, "domains", "manage");
  const { id } = await params;

  const order = await safe(
    () =>
      db.serviceOrder.findUnique({
        where: { id },
        include: {
          payment: true,
          lead: { select: { id: true } },
          journey: { select: { id: true, currentStep: true } },
          provisionedBy: { select: { name: true, email: true } },
        },
      }),
    null
  );

  if (!order) notFound();

  const statusVariant =
    order.status === "PAID" || order.status === "FULFILLING"
      ? "accent"
      : order.status === "COMPLETED"
        ? "cyan"
        : "default";

  const provisionDetails =
    order.provisionDetails && typeof order.provisionDetails === "object" && !Array.isArray(order.provisionDetails)
      ? (order.provisionDetails as Record<string, unknown>)
      : null;

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/services/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <ArrowLeft className="size-4" /> Бүх захиалга
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
            <Badge variant={statusVariant}>{DOMAIN_ORDER_STATUS_LABELS[order.status]}</Badge>
            <Badge variant="default">{SERVICE_TYPE_LABELS[order.serviceType]}</Badge>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {PLAN_KEY_LABELS[order.planKey] ?? order.planKey}
            {order.domainName ? ` · ${order.domainName}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDomainPrice(order.totalAmount)} · {order.billingMonths} сар
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Хэрэглэгч</h2>
            <div className="flex flex-col gap-4">
              <Field label="Нэр">{order.customerName}</Field>
              <Field label="Имэйл">
                <a href={`mailto:${order.customerEmail}`} className="text-accent hover:underline">
                  {order.customerEmail}
                </a>
              </Field>
              <Field label="Утас">{order.customerPhone}</Field>
              <Field label="Байгууллага">{order.company ?? "—"}</Field>
              <Field label="Домэйн">{order.domainName ?? "—"}</Field>
            </div>
          </div>

          {order.payment && (
            <div className="rounded-2xl border border-white/10 bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Төлбөр</h2>
              <div className="flex flex-col gap-4">
                <Field label="Арга">{order.payment.method}</Field>
                <Field label="Төлөв">
                  {PAYMENT_STATUS_LABELS[order.payment.status] ?? order.payment.status}
                </Field>
                <Field label="Дүн">{formatDomainPrice(order.payment.amount)}</Field>
                {order.payment.paidAt && (
                  <Field label="Төлсөн огноо">{formatDate(order.payment.paidAt)}</Field>
                )}
                {order.payment.expiresAt && order.payment.status === "PENDING" && (
                  <Field label="Хугацаа дуусах">{formatDate(order.payment.expiresAt)}</Field>
                )}
                {order.payment.qpayInvoiceId && (
                  <Field label="QPay invoice">
                    <span className="font-mono text-xs">{order.payment.qpayInvoiceId}</span>
                  </Field>
                )}
                {order.payment.transactionId && (
                  <Field label="Гүйлгээ">{order.payment.transactionId}</Field>
                )}
              </div>
            </div>
          )}

          {provisionDetails && (
            <div className="rounded-2xl border border-white/10 bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Тохируулгын мэдээлэл</h2>
              <div className="flex flex-col gap-4">
                {provisionDetails.cpanelUrl != null && (
                  <Field label="cPanel URL">{String(provisionDetails.cpanelUrl)}</Field>
                )}
                {provisionDetails.cpanelUser != null && (
                  <Field label="cPanel хэрэглэгч">{String(provisionDetails.cpanelUser)}</Field>
                )}
                {provisionDetails.mailboxCount != null && (
                  <Field label="Имэйл хайрцаг">{String(provisionDetails.mailboxCount)}</Field>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <ServiceOrderFulfillment
            order={{
              id: order.id,
              status: order.status,
              serviceType: order.serviceType,
              adminNotes: order.adminNotes,
              provisionDetails: provisionDetails as {
                cpanelUrl?: string;
                cpanelUser?: string;
                mailboxCount?: number;
              } | null,
              paymentCompleted: order.payment?.status === "COMPLETED",
              paymentMethod: order.payment?.method,
            }}
            canManage={canManage}
          />

          {(order.provisionedAt || order.provisionedBy) && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6 text-sm text-muted-foreground">
              {order.provisionedAt && <p>Дууссан: {formatDate(order.provisionedAt)}</p>}
              {order.provisionedBy && (
                <p>Гүйцэтгэсэн: {order.provisionedBy.name ?? order.provisionedBy.email}</p>
              )}
            </div>
          )}

          {(order.lead || order.journey) && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-card p-6 text-sm">
              <h2 className="mb-2 font-semibold">Холбоос</h2>
              {order.lead && (
                <p>
                  Лид:{" "}
                  <Link href="/admin/leads" className="text-accent hover:underline">
                    {order.lead.id.slice(0, 8)}…
                  </Link>
                </p>
              )}
              {order.journey && (
                <p className="mt-1 text-muted-foreground">Journey: {order.journey.currentStep}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}