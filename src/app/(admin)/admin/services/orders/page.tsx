import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, safe } from "@/lib/admin";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatDomainPrice } from "@/lib/domains/format";
import { DOMAIN_ORDER_STATUS_LABELS } from "@/lib/domains/order-status";
import {
  PLAN_KEY_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/services/order-status";
import type { DomainOrderStatus, ServiceType } from "@prisma/client";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTER_STATUSES: (DomainOrderStatus | "ALL")[] = [
  "ALL",
  "PENDING_PAYMENT",
  "PAID",
  "FULFILLING",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
];

const FILTER_TYPES: (ServiceType | "ALL")[] = ["ALL", "HOSTING", "EMAIL"];

function statusBadgeVariant(status: DomainOrderStatus): "default" | "accent" | "cyan" {
  if (status === "PAID" || status === "FULFILLING") return "accent";
  if (status === "COMPLETED") return "cyan";
  return "default";
}

export default async function AdminServiceOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  await requirePermission("domains", "read");
  const { status: statusFilter, type: typeFilter } = await searchParams;

  const activeStatus =
    statusFilter && FILTER_STATUSES.includes(statusFilter as DomainOrderStatus | "ALL")
      ? statusFilter
      : "ALL";

  const activeType =
    typeFilter && FILTER_TYPES.includes(typeFilter as ServiceType | "ALL")
      ? typeFilter
      : "ALL";

  const where: {
    status?: DomainOrderStatus;
    serviceType?: ServiceType;
  } = {};

  if (activeStatus !== "ALL") where.status = activeStatus as DomainOrderStatus;
  if (activeType !== "ALL") where.serviceType = activeType as ServiceType;

  const [orders, counts, typeCounts] = await Promise.all([
    safe(
      () =>
        db.serviceOrder.findMany({
          where: Object.keys(where).length ? where : undefined,
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      []
    ),
    safe(
      () =>
        db.serviceOrder.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      []
    ),
    safe(
      () =>
        db.serviceOrder.groupBy({
          by: ["serviceType"],
          _count: { _all: true },
        }),
      []
    ),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const countByType = Object.fromEntries(typeCounts.map((c) => [c.serviceType, c._count._all]));
  const actionCount = (countByStatus.PAID ?? 0) + (countByStatus.FULFILLING ?? 0);

  function buildHref(overrides: { status?: string; type?: string }) {
    const params = new URLSearchParams();
    const status = overrides.status ?? (activeStatus !== "ALL" ? activeStatus : undefined);
    const type = overrides.type ?? (activeType !== "ALL" ? activeType : undefined);
    if (status && status !== "ALL") params.set("status", status);
    if (type && type !== "ALL") params.set("type", type);
    const qs = params.toString();
    return qs ? `/admin/services/orders?${qs}` : "/admin/services/orders";
  }

  return (
    <div>
      <AdminHeader
        title="Үйлчилгээний захиалга"
        description={
          actionCount > 0
            ? `${actionCount} захиалга тохируулга хүлээгдэж байна (Төлсөн + Тохируулж байна).`
            : "Хостинг болон бизнес имэйлийн захиалга, төлбөр, гараар тохируулалт."
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_TYPES.map((t) => {
          const count = t === "ALL" ? typeCounts.reduce((n, c) => n + c._count._all, 0) : countByType[t] ?? 0;
          const active = activeType === t;
          return (
            <Link
              key={t}
              href={buildHref({ type: t === "ALL" ? "" : t })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-accent-cyan bg-accent-cyan/10 text-foreground"
                  : "border-white/10 text-muted-foreground hover:border-white/20"
              )}
            >
              {t === "ALL" ? "Бүх үйлчилгээ" : SERVICE_TYPE_LABELS[t]} ({count})
            </Link>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_STATUSES.map((s) => {
          const count =
            s === "ALL" ? counts.reduce((n, c) => n + c._count._all, 0) : countByStatus[s] ?? 0;
          const active = activeStatus === s;
          return (
            <Link
              key={s}
              href={buildHref({ status: s === "ALL" ? "" : s })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-white/10 text-muted-foreground hover:border-white/20"
              )}
            >
              {s === "ALL" ? "Бүгд" : DOMAIN_ORDER_STATUS_LABELS[s]} ({count})
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <EmptyState message="Үйлчилгээний захиалга алга байна. Хостинг/имэйл checkout идэвхжсний дараа энд харагдана." />
      ) : (
        <TableShell
          head={["Захиалга", "Үйлчилгээ", "Багц", "Домэйн", "Үнэ", "Төлөв", "Хэрэглэгч", "Огноо"]}
        >
          {orders.map((o) => (
            <tr key={o.id} className="align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/services/orders/${o.id}`}
                  className="font-mono text-sm text-accent hover:underline"
                >
                  {o.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge variant="default">{SERVICE_TYPE_LABELS[o.serviceType]}</Badge>
              </td>
              <td className="px-4 py-3 font-medium">
                {PLAN_KEY_LABELS[o.planKey] ?? o.planKey}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{o.domainName ?? "—"}</td>
              <td className="px-4 py-3">{formatDomainPrice(o.totalAmount)}</td>
              <td className="px-4 py-3">
                <Badge variant={statusBadgeVariant(o.status)}>
                  {DOMAIN_ORDER_STATUS_LABELS[o.status] ?? o.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium">{o.customerName}</div>
                <div className="text-sm text-muted-foreground">{o.customerEmail}</div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}