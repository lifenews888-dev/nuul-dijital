"use client";

import { useState } from "react";
import { CalendarCheck, Check, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function MeetingForm() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setState("done");
        track("meeting_request", { topic: String(data.topic ?? "") });
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
          <CalendarCheck className="size-7" />
        </div>
        <h3 className="text-xl font-semibold">Уулзалтын хүсэлт хүлээн авлаа!</h3>
        <p className="text-muted-foreground">
          Бид таны санал болгосон цагийг хянаад, баталгаажуулах имэйл илгээх болно.
        </p>
        <Button variant="outline" onClick={() => setState("idle")}>
          Дахин захиалах
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-name">Нэр *</Label>
          <Input id="m-name" name="name" required placeholder="Таны нэр" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-email">Имэйл *</Label>
          <Input id="m-email" name="email" type="email" required placeholder="таны@имэйл.mn" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-phone">Утас</Label>
          <Input id="m-phone" name="phone" placeholder="+976 ..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-company">Байгууллага</Label>
          <Input id="m-company" name="company" placeholder="Компанийн нэр" />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-when">Тохирох өдөр / цаг *</Label>
          <Input id="m-when" name="preferredAt" required placeholder="Жишээ: 6/2, 14:00" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-topic">Сэдэв</Label>
          <Input id="m-topic" name="topic" placeholder="Жишээ: Вэб шинэчлэл" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="m-message">Тэмдэглэл</Label>
        <Textarea id="m-message" name="message" placeholder="Уулзалтаар ярилцах зүйлээ бичнэ үү..." />
      </div>
      {state === "error" && (
        <p className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="size-4" /> Алдаа гарлаа. Дахин оролдоно уу.
        </p>
      )}
      <Button type="submit" variant="gradient" size="lg" disabled={state === "loading"}>
        {state === "loading" ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            Уулзалт захиалах <CalendarCheck className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
