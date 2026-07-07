import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TldProductForm } from "@/components/admin/forms/tld-product-form";
import { formatDomainPrice } from "@/lib/domains/format";

export const dynamic = "force-dynamic";

export default async function EditTldProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("domains", "manage");
  const { id } = await params;

  const product = await safe(
    () =>
      db.tldProduct.findUnique({
        where: { id },
        include: { _count: { select: { orders: true } } },
      }),
    null
  );

  if (!product) notFound();

  return (
    <div>
      <AdminHeader
        title={`TLD засах — ${product.tld}`}
        description={`Бүртгэл: ${formatDomainPrice(product.registerPrice)} · ${product._count.orders} захиалга`}
      />
      <TldProductForm product={product} />
    </div>
  );
}