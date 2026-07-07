import type { TldProduct } from "@prisma/client";
import { saveTldProduct } from "@/app/admin/domains/actions";
import { CheckboxField, TextField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";

export function TldProductForm({ product }: { product?: TldProduct }) {
  const editing = !!product;

  return (
    <form action={saveTldProduct} className="max-w-2xl">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-5">
        {editing ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground/90">TLD</span>
            <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 font-mono font-semibold">
              {product.tld}
            </p>
            <input type="hidden" name="tld" value={product.tld} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <TextField name="tld" label="TLD" placeholder=".mn" required />
            <span className="text-xs text-muted-foreground">Цэгээр эхэлнэ — жишээ: .mn, .com</span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="labelMn" label="Шошго (MN)" defaultValue={product?.labelMn} required />
          <TextField name="labelEn" label="Шошго (EN)" defaultValue={product?.labelEn} required />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            name="registerPrice"
            label="Бүртгэл (₮)"
            type="number"
            defaultValue={product?.registerPrice ?? 45000}
            required
          />
          <TextField
            name="renewPrice"
            label="Сунгалт (₮)"
            type="number"
            defaultValue={product?.renewPrice ?? 45000}
            required
          />
          <TextField
            name="transferPrice"
            label="Шилжүүлэг (₮)"
            type="number"
            defaultValue={product?.transferPrice ?? ""}
            placeholder="Заавал биш"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <TextField
            name="minYears"
            label="Хамгийн бага жил"
            type="number"
            defaultValue={product?.minYears ?? 1}
            required
          />
          <TextField
            name="maxYears"
            label="Хамгийн их жил"
            type="number"
            defaultValue={product?.maxYears ?? 5}
            required
          />
          <TextField
            name="sortOrder"
            label="Дараалал"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
          />
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground/90">Төлөв</span>
          <select
            name="status"
            defaultValue={product?.status ?? "ACTIVE"}
            className="flex h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ACTIVE">Идэвхтэй</option>
            <option value="DISABLED">Идэвхгүй</option>
          </select>
        </label>

        <CheckboxField name="featured" label="Онцлох (хайлтын UI)" defaultChecked={product?.featured ?? false} />

        <div>
          <Button type="submit" variant="gradient" size="lg">
            {editing ? "Хадгалах" : "TLD нэмэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}