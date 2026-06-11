"use client";

import { useState } from "react";
import { Send, Check, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setState("done");
        track("contact_submit");
        e.currentTarget.reset();
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
        <h3 className="text-xl font-semibold">Хүсэлт хүлээн авлаа!</h3>
        <p className="text-muted-foreground">
          Бид таны хүсэлтийг хүлээн авлаа. 24 цагийн дотор холбогдох болно.
        </p>
        <Button variant="outline" onClick={() => setState("idle")}>
          Дахин илгээх
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Нэр *</Label>
          <Input id="name" name="name" required placeholder="Таны нэр" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Имэйл *</Label>
          <Input id="email" name="email" type="email" required placeholder="таны@имэйл.mn" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Утас</Label>
          <Input id="phone" name="phone" placeholder="+976 ..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Байгууллага</Label>
          <Input id="company" name="company" placeholder="Компанийн нэр" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Зурвас *</Label>
        <Textarea
          id="message"
          name="message"
          required
          placeholder="Төслийнхөө талаар бидэнд хэлнэ үү..."
        />
      </div>
      {state === "error" && (
        <p className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="size-4" /> Алдаа гарлаа. Дахин оролдоно уу.
        </p>
      )}
      <Button type="submit" variant="gradient" size="lg" disabled={state === "loading"}>
        {state === "loading" ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            Зурвас илгээх <Send className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
