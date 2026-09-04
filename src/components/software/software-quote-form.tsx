"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, Send } from "lucide-react";
import { softwareVendors } from "@/data/software";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground outline-none transition-colors focus:border-accent";

export function SoftwareQuoteForm({ vendor }: { vendor?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState("loading");
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/software-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setState("done");
        track("software_quote_submit");
        form.reset();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-accent/30 bg-accent/10 p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-white">
          <Check className="size-7" />
        </div>
        <h3 className="text-xl font-semibold">Хүсэлт хүлээн авлаа</h3>
        <p className="text-muted-foreground">
          24 цагийн дотор албан ёсны үнийн саналыг и-мэйлээр илгээнэ.
        </p>
        <Button variant="outline" onClick={() => setState("idle")}>
          Дахин илгээх
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Honeypot: bots fill this, people never see it. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Байгууллагын нэр *</Label>
          <Input id="company" name="company" required placeholder="Жишээ ХХК" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="regNumber">ТТД / регистр</Label>
          <Input id="regNumber" name="regNumber" placeholder="6123456" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="contactName">Холбоо барих хүн *</Label>
          <Input id="contactName" name="contactName" required placeholder="Овог нэр" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Утас *</Label>
          <Input id="phone" name="phone" required placeholder="+976 " />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">И-мэйл *</Label>
        <Input id="email" name="email" type="email" required placeholder="name@company.mn" />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="vendor">Үйлдвэрлэгч</Label>
          <select id="vendor" name="vendor" defaultValue={vendor ?? ""} className={SELECT_CLASS}>
            <option value="">Сонгох…</option>
            {softwareVendors.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="seats">Хэрэглэгчийн тоо</Label>
          <Input id="seats" name="seats" type="number" min={1} placeholder="10" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="term">Хугацаа</Label>
          <select id="term" name="term" defaultValue="" className={SELECT_CLASS}>
            <option value="">Сонгох…</option>
            <option value="Сар бүр">Сар бүр</option>
            <option value="1 жил">1 жил</option>
            <option value="3 жил">3 жил</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="products">Ямар программ хэрэгтэй вэ? *</Label>
        <Textarea
          id="products"
          name="products"
          required
          rows={3}
          placeholder="Жишээ: Photoshop, Illustrator — 5 дизайнерт; Acrobat Pro — 3 хүнд"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Нэмэлт тайлбар</Label>
        <Textarea id="message" name="message" rows={3} />
      </div>

      <Button type="submit" variant="gradient" size="lg" disabled={state === "loading"}>
        {state === "loading" ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Илгээж байна…
          </>
        ) : (
          <>
            Хүсэлт илгээх <Send className="size-4" />
          </>
        )}
      </Button>

      {state === "error" && (
        <p className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="size-4" /> Алдаа гарлаа. Дахин оролдоно уу.
        </p>
      )}
    </form>
  );
}
