"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FlowStep = {
  num: number;
  label: string;
};

type Props = {
  steps: FlowStep[];
  activeStep: number;
  className?: string;
};

/**
 * Theme-safe step indicator — avoids white-on-white when used on light card surfaces.
 */
export function FlowSteps({ steps, activeStep, className }: Props) {
  return (
    <ol className={cn("grid grid-cols-3 gap-2", className)}>
      {steps.map((step) => {
        const done = step.num < activeStep;
        const active = step.num === activeStep;
        return (
          <li
            key={step.num}
            className={cn(
              "rounded-xl border px-2 py-3 text-center transition-colors",
              done && "border-accent/40 bg-accent/10",
              active && "border-accent bg-accent/15 ring-1 ring-accent/30",
              !done && !active && "border-border bg-muted/60"
            )}
          >
            <span
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-full text-xs font-bold",
                done || active
                  ? "bg-accent-gradient text-white"
                  : "border border-border bg-background text-foreground/80"
              )}
            >
              {done ? <Check className="size-3.5" /> : step.num}
            </span>
            <p
              className={cn(
                "mt-2 text-[11px] font-medium leading-tight",
                active ? "font-semibold text-accent" : "text-muted-foreground"
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