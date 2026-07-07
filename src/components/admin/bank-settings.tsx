"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2 } from "lucide-react";
import { saveBankSettings } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BankSettings } from "@/lib/domains/bank-settings";

export function BankSettingsForm({ initial }: { initial: BankSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("bankName", form.bankName);
      fd.set("bankAccountName", form.bankAccountName);
      fd.set("bankAccountNumber", form.bankAccountNumber);
      fd.set("bankIban", form.bankIban);
      await saveBankSettings(fd);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const up = (key: keyof BankSettings, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={onSubmit} className="max-w-xl rounded-2xl border border-white/10 bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Building2 className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Банкны данс (домэйн төлбөр)</h2>
          <p className="text-sm text-muted-foreground">
            Банкны шилжүүлгийн зааварт харагдах мэдээлэл. Checkout дээр автоматаар ашиглагдана.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bankName">Банкны нэр</Label>
          <Input id="bankName" value={form.bankName} onChange={(e) => up("bankName", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">Дансны дугаар</Label>
          <Input
            id="bankAccountNumber"
            value={form.bankAccountNumber}
            onChange={(e) => up("bankAccountNumber", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankAccountName">Дансны эзэмшигч</Label>
          <Input
            id="bankAccountName"
            value={form.bankAccountName}
            onChange={(e) => up("bankAccountName", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankIban">IBAN</Label>
          <Input id="bankIban" value={form.bankIban} onChange={(e) => up("bankIban", e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="mt-6" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
        Хадгалах
      </Button>
    </form>
  );
}