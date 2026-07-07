import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, safe } from "@/lib/admin";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { formatDomainPrice } from "@/lib/domains/format";
import { DOMAIN_ORDER_STATUS_LABELS } from "@/lib/domains/order-status";
import type { DomainOrderStatus } from "@prisma/client";
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

function statusBadgeVariant(status: DomainOrderStatus): "default" | "accent" | "cyan" {
  if (status === "PAID" || status === "FULFILLING") return "accent";
  if (status === "COMPLETED") return "cyan";
  return "default";
}

export default async function AdminDomainOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("domains", "read");
  const { status: statusFilter } = await searchParams;
  const activeFilter =
    statusFilter && FILTER_STATUSES.includes(statusFilter as DomainOrderStatus | "ALL")
      ? statusFilter
      : "ALL";

  const where =
    activeFilter !== "ALL" ? { status: activeFilter as DomainOrderStatus } : undefined;

  const [orders, counts] = await Promise.all([
    safe(
      () =>
        db.domainOrder.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { tldProduct: { select: { tld: true } } },
        }),
      []
    ),
    safe(
      () =>
        db.domainOrder.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      []
    ),
  ]);

  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const actionCount = (countByStatus.PAID ?? 0) + (countByStatus.FULFILLING ?? 0);

  return (
    <div>
      <AdminHeader
        title="Домэйн захиалга"
        description={
          actionCount > 0
            ? `${actionCount} захиалга бүртгэл хүлээгдэж байна (Төлсөн + Бүртгэж байна).`
            : "Зочин checkout, QPay төлбөр, гараар бүртгэх workflow."
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_STATUSES.map((s) => {
          const count = s === "ALL" ? counts.reduce((n, c) => n + c._count._all, 0) : countByStatus[s] ?? 0;
          const active = activeFilter === s;
          return (
            <Link
              key={s}
              href={s === "ALL" ? "/admin/domains/orders" : `/admin/domains/orders?status=${s}`}
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
        <EmptyState message="Домэйн захиалга алга байна. /domains идэвхжүүлсний дараа энд харагдана." />
      ) : (
        <TableShell
          head={["Захиалга", "Домэйн", "Үнэ", "Төлөв", "Хэрэглэгч", "Огноо"]}
        >
          {orders.map((o) => (
            <tr key={o.id} className="align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/domains/orders/${o.id}`}
                  className="font-mono text-sm text-accent hover:underline"
                >
                  {o.orderNumber}
                </Link>
                {o.registrantVerified && (
                  <div className="mt-1">
                    <Badge variant="accent" className="text-[10px]">
                      Бичиг ✓
                    </Badge>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-medium">{o.domainName}</td>
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