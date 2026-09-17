"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Stamp } from "lucide-react";
import { saveCompanyProfile } from "@/app/(admin)/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CompanyProfile } from "@/lib/company-profile";

/**
 * The legal identity that heads every quotation.
 *
 * Left blank, the quotation simply omits the line — better than a placeholder a
 * buyer could check and find wrong.
 */
export function CompanyProfileForm({ initial }: { initial: CompanyProfile }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("companyLegalName", form.legalName);
      fd.set("companyRegNumber", form.regNumber);
      fd.set("companyVatNumber", form.vatNumber);
      fd.set("quoteValidDays", String(form.quoteValidDays));
      await saveCompanyProfile(fd);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const up = (key: keyof CompanyProfile, value: string) =>
    setForm((f) => ({
      ...f,
      [key]: key === "quoteValidDays" ? Number(value) || 0 : value,
    }));

  return (
    <form onSubmit={onSubmit} className="max-w-xl rounded-2xl border border-white/10 bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Stamp className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Компанийн хуулийн мэдээлэл</h2>
          <p className="text-sm text-muted-foreground">
            Албан ёсны үнийн саналын толгойд хэвлэгдэнэ. Байгууллагын худалдан авагч үнийг
            уншихаасаа өмнө хэнтэй гэрээ хийхээ шалгадаг.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyLegalName">Албан ёсны нэр</Label>
          <Input
            id="companyLegalName"
            value={form.legalName}
            onChange={(e) => up("legalName", e.target.value)}
            placeholder="Жишээ: Нуул Диджитал ХХК"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyRegNumber">Улсын бүртгэлийн дугаар (ТТД)</Label>
          <Input
            id="companyRegNumber"
            value={form.regNumber}
            onChange={(e) => up("regNumber", e.target.value)}
            placeholder="6123456"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyVatNumber">НӨАТ төлөгчийн дугаар</Label>
          <Input
            id="companyVatNumber"
            value={form.vatNumber}
            onChange={(e) => up("vatNumber", e.target.value)}
            placeholder="Хоосон бол үнийн саналд харагдахгүй"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quoteValidDays">Үнийн санал хүчинтэй хугацаа (хоног)</Label>
          <Input
            id="quoteValidDays"
            type="number"
            min={1}
            value={form.quoteValidDays}
            onChange={(e) => up("quoteValidDays", e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="mt-6" disabled={saving}>
        {saving ? <Loader2 className="animate-spin" /> : <Check className="size-4" />}
        Хадгалах
      </Button>
    </form>
  );
}
