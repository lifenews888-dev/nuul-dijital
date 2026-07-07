"use client";

import { Check, CircleDollarSign, Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CheckoutDetailRow = {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
};

type Step = {
  num: number;
  label: string;
};

type Props = {
  activeStep: 2 | 3;
  title: string;
  body: string;
  steps: Step[];
  details: CheckoutDetailRow[];
  tips?: string[];
  children?: React.ReactNode;
  doneLabel: string;
  onDone: () => void;
};

function CheckoutSteps({ steps, activeStep }: { steps: Step[]; activeStep: 2 | 3 }) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((step) => {
        const done = step.num < activeStep;
        const active = step.num === activeStep;
        return (
          <li
            key={step.num}
            className={cn(
              "rounded-xl border px-2 py-3 text-center transition-colors",
              done && "border-accent/30 bg-accent/10",
              active && "border-accent/50 bg-accent/15 ring-1 ring-accent/20",
              !done && !active && "border-white/10 bg-white/[0.02]"
            )}
          >
            <span
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-full text-xs font-bold",
                done || active
                  ? "bg-accent-gradient text-white"
                  : "border border-white/15 bg-white/5 text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" /> : step.num}
            </span>
            <p
              className={cn(
                "mt-2 text-[11px] font-medium leading-tight",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function CheckoutConfirmation({
  activeStep,
  title,
  body,
  steps,
  details,
  tips,
  children,
  doneLabel,
  onDone,
}: Props) {
  const Icon = activeStep === 3 ? CircleDollarSign : PackageCheck;

  return (
    <div className="space-y-5">
      <CheckoutSteps steps={steps} activeStep={activeStep} />

      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-lg shadow-accent/20">
          <Icon className="size-8" />
        </div>
        <h3 className="mt-5 text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
        <dl className="space-y-3">
          {details.map((row) => (
            <div
              key={row.label}
              className={cn(
                "flex items-start justify-between gap-4",
                row.highlight && "rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 -mx-1"
              )}
            >
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd
                className={cn(
                  "text-right text-sm font-semibold",
                  row.mono && "font-mono tracking-tight"
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {tips && tips.length > 0 && (
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-accent" />
              <span className="text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      )}

      {children}

      <Button type="button" variant="outline" className="w-full" onClick={onDone}>
        {doneLabel}
      </Button>
    </div>
  );
}

export function CheckoutQPayAction({
  label,
  loadingLabel,
  loading,
  error,
  onClick,
}: {
  label: string;
  loadingLabel: string;
  loading: boolean;
  error: string | null;
  onClick: () => void;
}) {
  return (
    <div className="space-y-3">
      {error && (
        <p
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button type="button" variant="gradient" onClick={onClick} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            {loadingLabel}
          </>
        ) : (
          label
        )}
      </Button>
    </div>
  );
}