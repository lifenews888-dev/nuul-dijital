import Image from "next/image";
import { FileText, Film } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { registerMedia } from "@/app/admin/actions";
import { AdminHeader, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMedia } from "@/app/admin/actions";
import { MediaUploader } from "@/components/admin/media-uploader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireUser();
  const assets = await safe(
    () => db.mediaAsset.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.mediaAsset.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Медиа сан" description="Зураг, видео, PDF файл" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Upload + register */}
        <div className="flex flex-col gap-4">
          <MediaUploader />
          <form action={registerMedia} className="rounded-2xl border border-white/10 bg-card p-5">
            <h3 className="font-semibold">URL-аар бүртгэх</h3>
            <p className="mt-1 text-sm text-muted-foreground">Гадаад зураг/файлын холбоосыг нэмэх.</p>
            <div className="mt-4 flex flex-col gap-3">
              <Input name="url" placeholder="https://...png" required />
              <Input name="alt" placeholder="Alt текст" />
              <select
                name="type"
                className="h-12 rounded-xl border border-input bg-white/[0.03] px-4 text-sm focus:border-accent/50 focus:outline-none"
              >
                <option value="IMAGE" className="bg-card">Зураг</option>
                <option value="VIDEO" className="bg-card">Видео</option>
                <option value="DOCUMENT" className="bg-card">Баримт (PDF)</option>
              </select>
              <Button type="submit" variant="outline">Бүртгэх</Button>
            </div>
          </form>
        </div>

        {/* Grid */}
        <div>
          {assets.length === 0 ? (
            <EmptyState message="Медиа алга байна." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {assets.map((a) => (
                <div key={a.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card">
                  <div className="relative flex aspect-square items-center justify-center bg-white/[0.02]">
                    {a.type === "IMAGE" ? (
                      <Image src={a.url} alt={a.alt ?? a.filename} fill sizes="200px" className="object-cover" />
                    ) : a.type === "VIDEO" ? (
                      <Film className="size-10 text-muted-foreground" />
                    ) : (
                      <FileText className="size-10 text-muted-foreground" />
                    )}
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <DeleteButton action={deleteMedia} id={a.id} />
                    </div>
                  </div>
                  <div className="truncate px-3 py-2 text-xs text-muted-foreground">{a.filename}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
