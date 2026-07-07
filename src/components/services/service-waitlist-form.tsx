"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

type ServiceType = "hosting" | "email" | "ssl";

type Props = {
  service: ServiceType;
  journeyId?: string;
  selectedPlan?: string | null;
  className?: string;
};

export function ServiceWaitlistForm({ service, journeyId, selectedPlan, className }: Props) {
  const t = useTranslations("services.waitlist");
  const tf = useTranslations("forms");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/services/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          service,
          plan: selectedPlan ?? undefined,
          journeyId: journeyId ?? undefined,
        }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) {
        track("funnel_waitlist_submit", {
          service,
          plan: selectedPlan ?? "",
          journeyId: journeyId ?? "",
        });
        setEmail("");
        setName("");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm ${className ?? ""}`}
      >
        <Check className="size-5 shrink-0 text-accent" />
        <span>{t("done")}</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`waitlist-name-${service}`}>{tf("name")}</Label>
          <Input
            id={`waitlist-name-${service}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`waitlist-email-${service}`}>{tf("email")} *</Label>
          <Input
            id={`waitlist-email-${service}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder={tf("emailPlaceholder")}
          />
        </div>
      </div>
      {selectedPlan && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("selectedPlan")}: <span className="font-medium text-foreground">{selectedPlan}</span>
        </p>
      )}
      {state === "error" && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {t("error")}
        </p>
      )}
      <Button type="submit" variant="gradient" className="mt-4 w-full sm:w-auto" disabled={state === "loading"}>
        {state === "loading" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {t("submit")} <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}