import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission, safe } from "@/lib/admin";
import { deleteTldProduct } from "@/app/admin/domains/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { formatDomainPrice } from "@/lib/domains/format";

export const dynamic = "force-dynamic";

export default async function AdminDomainPricingPage() {
  await requirePermission("domains", "manage");

  const products = await safe(
    () =>
      db.tldProduct.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { orders: true } } },
      }),
    []
  );

  return (
    <div>
      <AdminHeader
        title="TLD үнэ"
        description="Домэйн TLD каталог — үнэ, төлөв, онцлох тохиргоо. Өөрчлөлт шууд хайлт болон checkout-д тусгагдана."
        newHref="/admin/domains/pricing/new"
        newLabel="TLD нэмэх"
      />

      {products.length === 0 ? (
        <EmptyState message="TLD бүтээгдэхүүн алга. npm run db:seed ажиллуулна уу." />
      ) : (
        <TableShell
          head={["TLD", "Шошго (MN)", "Бүртгэл", "Сунгалт", "Жил", "Төлөв", "Онцлох", ""]}
        >
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono font-semibold">{p.tld}</td>
              <td className="px-4 py-3">{p.labelMn}</td>
              <td className="px-4 py-3">{formatDomainPrice(p.registerPrice)}</td>
              <td className="px-4 py-3">{formatDomainPrice(p.renewPrice)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {p.minYears}–{p.maxYears}
              </td>
              <td className="px-4 py-3">
                <Badge variant={p.status === "ACTIVE" ? "accent" : "default"}>
                  {p.status === "ACTIVE" ? "Идэвхтэй" : "Идэвхгүй"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{p.featured ? "Тийм" : "—"}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/domains/pricing/${p.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton
                    action={deleteTldProduct}
                    id={p.id}
                    label={
                      p._count.orders > 0
                        ? `${p.tld} идэвхгүй болгох уу? (${p._count.orders} захиалга холбоотой)`
                        : `${p.tld} устгах уу?`
                    }
                  />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}