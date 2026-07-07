"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  hasPassword: boolean;
};

export function AppAccountPasswordPanel({ hasPassword }: Props) {
  const t = useTranslations("app.password");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorCode(null);

    try {
      const res = await fetch("/api/app/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setState("error");
        setErrorCode(data.error ?? "UNKNOWN");
        return;
      }

      setState("done");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setState("error");
      setErrorCode("UNKNOWN");
    }
  }

  const errorMessage =
    errorCode === "WRONG_PASSWORD"
      ? t("errors.wrongCurrent")
      : errorCode === "WEAK_PASSWORD"
        ? t("errors.weak")
        : state === "error"
          ? t("errors.generic")
          : null;

  if (state === "done") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm">
        <Check className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="font-medium">{t("successTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("successBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border bg-card/60 p-6"
    >
      <h2 className="text-lg font-semibold">
        {hasPassword ? t("changeTitle") : t("setTitle")}
      </h2>
      <p className="text-sm text-muted-foreground">{t("setSubtitle")}</p>

      {hasPassword && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="account-current">{t("currentPassword")}</Label>
          <Input
            id="account-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="account-new">{t("newPassword")}</Label>
        <Input
          id="account-new"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="account-confirm">{t("confirmPassword")}</Label>
        <Input
          id="account-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      <Button type="submit" variant="gradient" disabled={state === "loading"}>
        {state === "loading" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Lock className="size-4" />
            {t("submit")}
          </>
        )}
      </Button>
    </form>
  );
}