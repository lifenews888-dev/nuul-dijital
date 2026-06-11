"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { services } from "@/data/services";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const budgets = ["5 сая ₮ хүртэл", "5 - 15 сая ₮", "15 - 50 сая ₮", "50 сая ₮-с дээш"];
const timelines = ["1 сар хүртэл", "1 - 3 сар", "3 - 6 сар", "Уян хатан"];
const DOMAIN = [
  { value: "HAVE", key: "domainHave" },
  { value: "BUY", key: "domainBuy" },
  { value: "SUGGEST", key: "domainSuggest" },
] as const;
const PAGE_PRESETS = ["Нүүр", "Бидний тухай", "Үйлчилгээ", "Бүтээгдэхүүн", "Блог", "Холбоо барих", "Цэс / меню", "Сэтгэгдэл"];
const FEATURE_PRESETS = [
  "Онлайн төлбөр (QPay)",
  "Цаг захиалга",
  "Хэрэглэгчийн бүртгэл / нэвтрэлт",
  "Чат / мессеж",
  "Олон хэл",
  "Хайлт",
  "Захиалгын систем",
  "Имэйл бүртгэл",
  "Админ самбар",
  "Газрын зураг",
];

type FormData = {
  services: string[];
  domainStatus: string;
  domainName: string;
  hosting: boolean | null;
  hasLogo: boolean | null;
  pages: string[];
  features: string[];
  needsAuth: boolean | null;
  budget: string;
  timeline: string;
  colors: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  about: string;
  goal: string;
  notes: string;
};

const initial: FormData = {
  services: [], domainStatus: "", domainName: "", hosting: null, hasLogo: null,
  pages: [], features: [], needsAuth: null, budget: "", timeline: "", colors: "",
  name: "", email: "", phone: "", company: "", about: "", goal: "", notes: "",
};

const STEP_KEYS = ["step0", "step1", "step2", "step3", "step4"] as const;

function chip(active: boolean) {
  return cn(
    "rounded-2xl border p-4 text-sm font-medium transition-all",
    active
      ? "border-accent bg-accent/10 text-foreground"
      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const t = useTranslations("wizard");
  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => onChange(true)} className={cn(chip(value === true), "px-6")}>{t("yes")}</button>
      <button type="button" onClick={() => onChange(false)} className={cn(chip(value === false), "px-6")}>{t("no")}</button>
    </div>
  );
}

function ChipSelect({ presets, value, onChange, placeholder }: { presets: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const t = useTranslations("wizard");
  const [custom, setCustom] = useState("");
  const toggle = (i: string) => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i]);
  const add = () => { const v = custom.trim(); if (v && !value.includes(v)) onChange([...value, v]); setCustom(""); };
  const customs = value.filter((v) => !presets.includes(v));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => toggle(p)} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-all", value.includes(p) ? "border-accent bg-accent/10 text-foreground" : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20")}>{p}</button>
        ))}
        {customs.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-4 py-2 text-sm font-medium">
            {c}<button type="button" onClick={() => toggle(c)} aria-label={t("remove")}><X className="size-3.5 text-muted-foreground hover:text-foreground" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} className="flex-1" />
        <Button type="button" variant="outline" onClick={add}><Plus className="size-4" /> {t("add")}</Button>
      </div>
    </div>
  );
}

export function QuoteWizard() {
  const t = useTranslations("wizard");
  const tf = useTranslations("forms");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initial);
  const [references, setReferences] = useState<string[]>([""]);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const up = <K extends keyof FormData>(k: K, v: FormData[K]) => setData((d) => ({ ...d, [k]: v }));
  const toggleService = (t: string) =>
    up("services", data.services.includes(t) ? data.services.filter((s) => s !== t) : [...data.services, t]);

  const canNext =
    (step === 0 && data.services.length > 0) ||
    (step === 1 && !!data.domainStatus) ||
    step === 2 ||
    (step === 3 && !!data.budget && !!data.timeline) ||
    step === 4;

  const last = STEP_KEYS.length - 1;

  async function submit() {
    setState("loading");
    const payload = { ...data, references: references.map((r) => r.trim()).filter(Boolean) };
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) track("brief_submit", { services: data.services.join(","), budget: data.budget });
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-accent/30 bg-accent/10 p-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent-gradient text-white">
          <Check className="size-8" />
        </div>
        <h3 className="text-2xl font-bold">{t("doneTitle")}</h3>
        <p className="max-w-md text-muted-foreground">
          {t("doneText", { name: data.name || t("friend") })}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-card p-6 sm:p-10">
      {/* progress */}
      <div className="mb-8 flex items-center gap-3">
        {STEP_KEYS.map((key, i) => (
          <div key={key} className="flex flex-1 items-center gap-3">
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors", i <= step ? "bg-accent text-white" : "bg-white/5 text-muted-foreground")}>
              {i < step ? <Check className="size-4" /> : i + 1}
            </div>
            <span className={cn("hidden text-sm font-medium lg:block", i <= step ? "text-foreground" : "text-muted-foreground")}>{t(key)}</span>
            {i < last && (
              <div className="h-px flex-1 bg-white/10">
                <div className="h-px bg-accent transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          {/* STEP 0 — services */}
          {step === 0 && (
            <div>
              <h3 className="text-xl font-semibold">{t("step0Title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("step0Hint")}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => {
                  const active = data.services.includes(s.title);
                  return (
                    <button key={s.slug} type="button" onClick={() => toggleService(s.title)} className={cn("flex items-center gap-3 text-left", chip(active))}>
                      <s.icon className={cn("size-5 shrink-0", active && "text-accent")} />
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1 — project basics */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="text-xl font-semibold">{t("domainTitle")}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {DOMAIN.map((o) => (
                    <button key={o.value} type="button" onClick={() => up("domainStatus", o.value)} className={chip(data.domainStatus === o.value)}>{t(o.key)}</button>
                  ))}
                </div>
                {(data.domainStatus === "HAVE" || data.domainStatus === "SUGGEST") && (
                  <Input value={data.domainName} onChange={(e) => up("domainName", e.target.value)} placeholder={data.domainStatus === "HAVE" ? t("domainPlaceholderHave") : t("domainPlaceholderSuggest")} className="mt-3 max-w-sm" />
                )}
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-xl font-semibold">{t("hostingTitle")}</h3>
                  <div className="mt-4"><YesNo value={data.hosting} onChange={(v) => up("hosting", v)} /></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{t("logoTitle")}</h3>
                  <div className="mt-4"><YesNo value={data.hasLogo} onChange={(v) => up("hasLogo", v)} /></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — pages & features */}
          {step === 2 && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="text-xl font-semibold">{t("pagesTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("pagesHint")}</p>
                <div className="mt-4"><ChipSelect presets={PAGE_PRESETS} value={data.pages} onChange={(v) => up("pages", v)} placeholder={t("pagesAdd")} /></div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("featuresTitle")}</h3>
                <div className="mt-4"><ChipSelect presets={FEATURE_PRESETS} value={data.features} onChange={(v) => up("features", v)} placeholder={t("featuresAdd")} /></div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("authTitle")}</h3>
                <div className="mt-4"><YesNo value={data.needsAuth} onChange={(v) => up("needsAuth", v)} /></div>
              </div>
            </div>
          )}

          {/* STEP 3 — budget, timeline, references */}
          {step === 3 && (
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="text-xl font-semibold">{t("budgetTitle")}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {budgets.map((b) => (
                    <button key={b} type="button" onClick={() => up("budget", b)} className={chip(data.budget === b)}>{b}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("timelineTitle")}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {timelines.map((t) => (
                    <button key={t} type="button" onClick={() => up("timeline", t)} className={chip(data.timeline === t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t("refsTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("refsHint")}</p>
                <div className="mt-4 flex flex-col gap-3">
                  {references.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={v} onChange={(e) => setReferences(references.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder="https://example.mn" className="flex-1" />
                      {references.length > 1 && (
                        <button type="button" onClick={() => setReferences(references.filter((_, idx) => idx !== i))} className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted-foreground hover:text-error" aria-label={t("remove")}><X className="size-4" /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => setReferences([...references, ""])} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent hover:underline"><Plus className="size-4" /> {t("refsAdd")}</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="q-colors">{t("colorsLabel")}</Label>
                <Input id="q-colors" value={data.colors} onChange={(e) => up("colors", e.target.value)} placeholder={t("colorsPlaceholder")} />
              </div>
            </div>
          )}

          {/* STEP 4 — contact + brief */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-xl font-semibold">{t("contactTitle")}</h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2"><Label htmlFor="q-name">{tf("name")} *</Label><Input id="q-name" required value={data.name} onChange={(e) => up("name", e.target.value)} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="q-email">{tf("email")} *</Label><Input id="q-email" type="email" required value={data.email} onChange={(e) => up("email", e.target.value)} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="q-phone">{tf("phone")}</Label><Input id="q-phone" value={data.phone} onChange={(e) => up("phone", e.target.value)} placeholder="99112255" /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="q-company">{tf("company")}</Label><Input id="q-company" value={data.company} onChange={(e) => up("company", e.target.value)} /></div>
              </div>
              <div className="flex flex-col gap-2"><Label htmlFor="q-about">{t("aboutLabel")}</Label><Textarea id="q-about" rows={2} value={data.about} onChange={(e) => up("about", e.target.value)} placeholder={t("aboutPlaceholder")} /></div>
              <div className="flex flex-col gap-2"><Label htmlFor="q-goal">{t("goalLabel")}</Label><Textarea id="q-goal" rows={2} value={data.goal} onChange={(e) => up("goal", e.target.value)} placeholder={t("goalPlaceholder")} /></div>
              <div className="flex flex-col gap-2"><Label htmlFor="q-notes">{t("notesLabel")}</Label><Textarea id="q-notes" value={data.notes} onChange={(e) => up("notes", e.target.value)} placeholder={t("notesPlaceholder")} /></div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} className={cn(step === 0 && "invisible")}>
          <ArrowLeft className="size-4" /> {t("back")}
        </Button>
        {step < last ? (
          <Button variant="gradient" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            {t("next")} <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button variant="gradient" size="lg" disabled={state === "loading" || !data.name || !data.email} onClick={submit}>
            {state === "loading" ? <Loader2 className="size-5 animate-spin" /> : (<>{t("submit")} <Check className="size-4" /></>)}
          </Button>
        )}
      </div>
    </div>
  );
}
