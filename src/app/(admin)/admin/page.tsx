import Link from "next/link";
import { FileText, FolderKanban, Inbox, CalendarCheck, ClipboardList, ArrowRight, Database, Globe, Server } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { DOMAIN_ORDER_STATUS_LABELS } from "@/lib/domains/order-status";
import { formatDate } from "@/lib/utils";
import type { DomainOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireUser();
  const dbConnected = Boolean(process.env.DATABASE_URL);

  const [posts, projects, leads, briefs, contacts, meetings, domainQueue, serviceQueue, recentDomainOrders, recentLeads, postsByStatus, recentActivity] =
    await Promise.all([
      safe(() => db.post.count(), 0),
      safe(() => db.project.count(), 0),
      safe(() => db.lead.count(), 0),
      safe(() => db.projectBrief.count({ where: { status: "NEW" } }), 0),
      safe(() => db.contactMessage.count({ where: { read: false } }), 0),
      safe(() => db.meeting.count({ where: { status: "REQUESTED" } }), 0),
      safe(
        () => db.domainOrder.count({ where: { status: { in: ["PAID", "FULFILLING"] } } }),
        0
      ),
      safe(
        () => db.serviceOrder.count({ where: { status: { in: ["PAID", "FULFILLING"] } } }),
        0
      ),
      safe(
        () =>
          db.domainOrder.findMany({
            where: { status: { in: ["PAID", "FULFILLING", "PENDING_PAYMENT"] } },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, orderNumber: true, domainName: true, status: true, createdAt: true },
          }),
        [] as { id: string; orderNumber: string; domainName: string; status: string; createdAt: Date }[]
      ),
      safe(
        () => db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
        [] as Awaited<ReturnType<typeof db.lead.findMany>>
      ),
      safe(
        () => db.post.groupBy({ by: ["status"], _count: { _all: true } }),
        [] as { status: string; _count: { _all: number } }[]
      ),
      safe(
        () => db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
        [] as Awaited<ReturnType<typeof db.activityLog.findMany>>
      ),
    ]);

  const statusCount = (s: string) =>
    postsByStatus.find((x) => x.status === s)?._count._all ?? 0;

  const stats = [
    { label: "Нийтлэл", value: posts, icon: FileText, href: "/admin/posts" },
    { label: "Төслүүд", value: projects, icon: FolderKanban, href: "/admin/projects" },
    { label: "Нийт лид", value: leads, icon: Inbox, href: "/admin/leads" },
    { label: "Шинэ загвар хүсэлт", value: briefs, icon: ClipboardList, href: "/admin/briefs" },
    { label: "Уншаагүй хүсэлт", value: contacts, icon: Inbox, href: "/admin/contacts" },
    { label: "Хүлээгдэж буй уулзалт", value: meetings, icon: CalendarCheck, href: "/admin/meetings" },
    { label: "Домэйн бүртгэл", value: domainQueue, icon: Globe, href: "/admin/domains/orders?status=PAID" },
    { label: "Үйлчилгээ тохируулга", value: serviceQueue, icon: Server, href: "/admin/services/orders?status=PAID" },
  ];

  const statusBreakdown = [
    { label: "Нийтлэгдсэн", value: statusCount("PUBLISHED"), color: "bg-accent" },
    { label: "Ноорог", value: statusCount("DRAFT"), color: "bg-muted-foreground" },
    { label: "Товлосон", value: statusCount("SCHEDULED"), color: "bg-accent-cyan" },
    { label: "Архив", value: statusCount("ARCHIVED"), color: "bg-white/20" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Хяналтын самбар</h1>
      <p className="mt-1 text-sm text-muted-foreground">Nuul Digital удирдлагын тойм.</p>

      {!dbConnected && (
        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <Database className="mt-0.5 size-6 shrink-0 text-warning" />
          <div>
            <h2 className="font-semibold text-foreground">Өгөгдлийн сан холбогдоогүй байна</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Бүх тоо, жагсаалт хоосон харагдаж байгаа нь <code className="text-foreground">DATABASE_URL</code>{" "}
              тохируулагдаагүйтэй холбоотой. Контент үүсгэх, лид хадгалахын тулд PostgreSQL (Neon/Supabase)
              холбоод дахин deploy хийх шаардлагатай. Холболтын дараа энэ самбар бодит өгөгдлөөр дүүрнэ.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-white/10 bg-card p-5 transition-colors hover:border-white/20"
          >
            <div className="flex items-center justify-between">
              <s.icon className="size-5 text-accent" />
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-4 text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Content status breakdown */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-sm font-semibold text-muted-foreground">Нийтлэлийн төлөв</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statusBreakdown.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`size-2.5 rounded-full ${s.color}`} />
              <div>
                <div className="text-xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {recentDomainOrders.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Домэйн захиалга</h2>
            <Link href="/admin/domains/orders" className="text-sm text-accent hover:underline">
              Бүгдийг үзэх
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <ul className="divide-y divide-white/5">
              {recentDomainOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/domains/orders/${o.id}`}
                    className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-sm">{o.orderNumber}</div>
                      <div className="truncate text-sm text-muted-foreground">{o.domainName}</div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <div>{DOMAIN_ORDER_STATUS_LABELS[o.status as DomainOrderStatus] ?? o.status}</div>
                      <time>{formatDate(o.createdAt)}</time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Сүүлийн үйл ажиллагаа</h2>
            <Link href="/admin/activity" className="text-sm text-accent hover:underline">
              Бүгдийг үзэх
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Бүртгэл алга байна.</div>
            ) : (
              <ul className="divide-y divide-white/5">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm">{a.summary}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.userEmail ?? "—"}</div>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground">{formatDate(a.createdAt)}</time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent leads */}
        <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Сүүлийн лидүүд</h2>
          <Link href="/admin/leads" className="text-sm text-accent hover:underline">
            Бүгдийг үзэх
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          {recentLeads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Лид алга байна.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.name}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {l.email} · {l.services.join(", ")}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    <div>{l.budget ?? "—"}</div>
                    <time>{formatDate(l.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
