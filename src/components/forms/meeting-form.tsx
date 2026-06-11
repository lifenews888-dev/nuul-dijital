"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarCheck, Check, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

export function MeetingForm() {
  const t = useTranslations("forms");
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
        <h3 className="text-xl font-semibold">{t("meeting.doneTitle")}</h3>
        <p className="text-muted-foreground">{t("meeting.doneText")}</p>
        <Button variant="outline" onClick={() => setState("idle")}>
          {t("meeting.again")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-name">{t("name")} *</Label>
          <Input id="m-name" name="name" required placeholder={t("namePlaceholder")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-email">{t("email")} *</Label>
          <Input id="m-email" name="email" type="email" required placeholder={t("emailPlaceholder")} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-phone">{t("phone")}</Label>
          <Input id="m-phone" name="phone" placeholder="+976 ..." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-company">{t("company")}</Label>
          <Input id="m-company" name="company" placeholder={t("companyPlaceholder")} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-when">{t("meeting.when")} *</Label>
          <Input id="m-when" name="preferredAt" required placeholder={t("meeting.whenPlaceholder")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-topic">{t("meeting.topic")}</Label>
          <Input id="m-topic" name="topic" placeholder={t("meeting.topicPlaceholder")} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="m-message">{t("meeting.note")}</Label>
        <Textarea id="m-message" name="message" placeholder={t("meeting.notePlaceholder")} />
      </div>
      {state === "error" && (
        <p className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="size-4" /> {t("error")}
        </p>
      )}
      <Button type="submit" variant="gradient" size="lg" disabled={state === "loading"}>
        {state === "loading" ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <>
            {t("meeting.submit")} <CalendarCheck className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
