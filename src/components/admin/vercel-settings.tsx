import { CheckCircle2, AlertCircle, DownloadCloud, Save, Trash2 } from "lucide-react";
import { saveVercelConfig, clearVercelToken, importFromVercel } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function VercelSettings({ configured, teamId }: { configured: boolean; teamId: string | null }) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vercel холболт</h3>
        {configured ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="size-4" /> Холбогдсон
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <AlertCircle className="size-4" /> Тохируулаагүй
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Vercel дансны API токен оруулбал таны төслүүдийг портфолио руу (ноорог болгож) импортлоно.
      </p>

      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          <a href="https://vercel.com/account/settings/tokens" target="_blank" rel="noreferrer" className="text-accent underline">
            vercel.com → Account Settings → Tokens
          </a>{" "}
          руу орно
        </li>
        <li>«Create Token» → нэр өгч, Scope-д өөрийн баг/дансаа сонгоно</li>
        <li>Үүссэн токеноо (vcp_… эсвэл vercel_…) хуулаад доор тавиад «Хадгалах» дарна</li>
      </ol>

      <form action={saveVercelConfig} className="mt-5 grid max-w-xl gap-4">
        <div className="grid gap-2">
          <Label htmlFor="vercelApiToken">API Token</Label>
          <Input
            id="vercelApiToken"
            name="vercelApiToken"
            type="password"
            autoComplete="off"
            placeholder={configured ? "•••••••• (тохируулсан — солих бол шинэ токен оруул)" : "vcp_..."}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="vercelTeamId">Team / Org ID (заавал биш)</Label>
          <Input id="vercelTeamId" name="vercelTeamId" defaultValue={teamId ?? ""} placeholder="team_..." />
        </div>
        <div>
          <Button type="submit" variant="gradient">
            <Save className="size-4" /> Хадгалах
          </Button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        <form action={importFromVercel}>
          <Button type="submit" variant="outline" size="sm" disabled={!configured}>
            <DownloadCloud className="size-4" /> Одоо импорт хийх
          </Button>
        </form>
        {configured && (
          <form action={clearVercelToken}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              <Trash2 className="size-4" /> Токен устгах
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
