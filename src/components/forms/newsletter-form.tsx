"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const t = useTranslations("forms");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-foreground">
        <Check className="size-5 text-accent" /> {t("newsletter.done")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        required
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" variant="gradient" disabled={state === "loading"}>
        {state === "loading" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {t("newsletter.submit")} <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
