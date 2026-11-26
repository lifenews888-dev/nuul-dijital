"use client";

import { useState } from "react";
import { RegistryIcon } from "@/components/shared/registry-icon";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Service } from "@/data/services";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/*
 * Nuul Digital project planner.
 *
 * Built around what sets Nuul apart: we start from the business outcome, then
 * scope a phased build (must-have now, the rest later), and cover what runs it
 * afterwards — domain, hosting, email, licences and ongoing support — so one
 * partner owns the whole thing. Answers map onto the existing brief fields, so
 * the API, database and estimator are unchanged.
 */

const OUTCOMES = [
  "Онлайнаар илүү их борлуулах",
  "Захиалга, цаг захиалга авах",
  "Шинэ харилцагч татах",
  "Дотоод ажлаа автоматжуулах",
  "Харилцагчид 24/7 AI-аар хариулах",
  "Брэндээ мэргэжлийн түвшинд танилцуулах",
];
const INDUSTRIES = [
  "Худалдаа",
  "Хоол, үйлчилгээ",
  "Эрүүл мэнд",
  "Боловсрол",
  "Санхүү",
  "Үйлдвэрлэл, барилга",
  "Төрийн байгууллага",
  "Бусад",
];
const STARTING_POINT = [
  { value: "NEW", label: "Шинээр эхэлж байна" },
  { value: "REDO", label: "Сайт байгаа — шинэчилнэ" },
  { value: "SYSTEM", label: "Систем байгаа — сайжруулна" },
] as const;
const FEATURES = [
  "Онлайн төлбөр (QPay)",
  "Захиалгын систем",
  "Цаг захиалга",
  "Хэрэглэгчийн бүртгэл / нэвтрэлт",
  "AI чатбот",
  "И-баримт холболт",
  "Админ самбар, тайлан",
  "Олон хэл",
  "Мэдэгдэл (имэйл, SMS)",
  "Бусад системтэй холболт (API)",
];
const DOMAIN = [
  { value: "HAVE", key: "domainHave" },
  { value: "BUY", key: "domainBuy" },
  { value: "SUGGEST", key: "domainSuggest" },
] as const;
const ADDONS = [
  "Бизнес имэйл",
  "Microsoft 365",
  "Kaspersky хамгаалалт",
  "Өдөр бүрийн нөөцлөлт",
  "Монголд байрлах сервер",
];
const SUPPORT = [
  { value: "Нэг удаа хүлээлгэн өгнө", hint: "Бид хийгээд, та өөрөө ажиллуулна" },
  { value: "Сар бүрийн засвар үйлчилгээ", hint: "Шинэчлэлт, жижиг засвар, нөөцлөлт" },
  { value: "Бүрэн хариуцлага (SLA)", hint: "Хостинг, хяналт, аюулгүй байдал — бүгдийг бид" },
];
const budgets = ["5 сая ₮ хүртэл", "5 - 15 сая ₮", "15 - 50 сая ₮", "50 сая ₮-с дээш", "Зөвлөгөө хэрэгтэй"];
const timelines = ["1 сар хүртэл", "1 - 3 сар", "3 - 6 сар", "Уян хатан"];

type Priority = "now" | "later";

type FormData = {
  outcomes: string[];
  industry: string;
  start: string;
  currentUrl: string;
  services: string[];
  features: Record<string, Priority>;
  domainStatus: string;
  domainName: string;
  hosting: boolean | null;
  hasLogo: boolean | null;
  addons: string[];
  support: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  about: string;
  notes: string;
};

/* Fields other pages may pre-fill through the URL (domain search → brief). */
type InitialOverrides = Partial<{
  domainStatus: string;
  domainName: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  services: string[];
}>;

const empty: FormData = {
  outcomes: [], industry: "", start: "", currentUrl: "", services: [], features: {},
  domainStatus: "", domainName: "", hosting: null, hasLogo: null, addons: [], support: "",
  budget: "", timeline: "", name: "", email: "", phone: "", company: "", about: "", notes: "",
};

function normalizeDomain(raw: string): string {
  return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase().trim();
}

function buildInitialState(o?: InitialOverrides): FormData {
  const merged: FormData = { ...empty, ...(o as Partial<FormData>) };
  if (o?.domainName) {
    merged.domainName = normalizeDomain(o.domainName);
    if (!merged.domainStatus) merged.domainStatus = "HAVE";
  }
  return merged;
}

const STEP_KEYS = ["step0", "step1", "step2", "step3", "step4"] as const;

const pill = (active: boolean) =>
  cn(
    "rounded-full border px-4 py-2 text-sm font-medium transition-all",
    active
      ? "border-accent bg-accent/10 text-foreground"
      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
  );

const card = (active: boolean) =>
  cn(
    "rounded-2xl border p-4 text-left text-sm font-medium transition-all",
    active
      ? "border-accent bg-accent/10 text-foreground"
      : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
  );

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const t = useTranslations("wizard");
  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => onChange(true)} className={cn(card(value === true), "px-6")}>{t("yes")}</button>
      <button type="button" onClick={() => onChange(false)} className={cn(card(value === false), "px-6")}>{t("no")}</button>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

type Props = {
  initial?: InitialOverrides;
  journeyId?: string;
  services: Service[];
};

export function QuoteWizard({ initial, journeyId, services }: Props) {
  const t = useTranslations("wizard");
  const tf = useTranslations("forms");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(() => buildInitialState(initial));
  const [references, setReferences] = useState<string[]>([""]);
  const [customFeature, setCustomFeature] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const up = <K extends keyof FormData>(k: K, v: FormData[K]) => setData((d) => ({ ...d, [k]: v }));
  const toggleIn = (k: "outcomes" | "services" | "addons", v: string) =>
    up(k, data[k].includes(v) ? data[k].filter((x) => x !== v) : [...data[k], v]);

  /* A feature cycles: off → needed now → later phase → off. */
  const cycleFeature = (f: string) => {
    const next = { ...data.features };
    if (!next[f]) next[f] = "now";
    else if (next[f] === "now") next[f] = "later";
    else delete next[f];
    up("features", next);
  };
  const addFeature = () => {
    const v = customFeature.trim();
    if (v && !data.features[v]) up("features", { ...data.features, [v]: "now" });
    setCustomFeature("");
  };
  const customFeatures = Object.keys(data.features).filter((f) => !FEATURES.includes(f));

  const canNext =
    (step === 0 && data.outcomes.length > 0 && !!data.start) ||
    (step === 1 && data.services.length > 0) ||
    (step === 2 && !!data.domainStatus) ||
    (step === 3 && !!data.support && !!data.budget && !!data.timeline) ||
    step === 4;

  const last = STEP_KEYS.length - 1;

  async function submit() {
    setState("loading");
    const now = Object.entries(data.features).filter(([, p]) => p === "now").map(([f]) => f);
    const later = Object.entries(data.features).filter(([, p]) => p === "later").map(([f]) => f);
    const startLabel = STARTING_POINT.find((s) => s.value === data.start)?.label ?? "";
    const notes = [
      later.length ? `Дараагийн үе шатанд: ${later.join(", ")}` : "",
      data.addons.length ? `Нэмэлт үйлчилгээ: ${data.addons.join(", ")}` : "",
      data.support ? `Ашиглалтын дараах дэмжлэг: ${data.support}` : "",
      data.currentUrl ? `Одоогийн сайт/систем: ${data.currentUrl}` : "",
      data.notes,
    ].filter(Boolean).join("\n");

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      about: data.about,
      goal: data.outcomes.join(", "),
      audience: data.industry,
      projectTypes: startLabel ? [startLabel] : [],
      services: data.services,
      features: now,
      needsAuth: now.includes("Хэрэглэгчийн бүртгэл / нэвтрэлт") ? true : null,
      domainStatus: data.domainStatus,
      domainName: data.domainName,
      hosting: data.hosting,
      hasLogo: data.hasLogo,
      budget: data.budget,
      timeline: data.timeline,
      notes,
      references: references.map((r) => r.trim()).filter(Boolean),
      ...(journeyId ? { journeyId } : {}),
    };
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
        <p className="max-w-md text-muted-foreground">{t("doneText", { name: data.name || t("friend") })}</p>
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
          {/* STEP 0 — outcome first */}
          {step === 0 && (
            <div className="flex flex-col gap-8">
              <Section title={t("outcomeTitle")} hint={t("outcomeHint")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {OUTCOMES.map((o) => (
                    <button key={o} type="button" onClick={() => toggleIn("outcomes", o)} className={card(data.outcomes.includes(o))}>{o}</button>
                  ))}
                </div>
              </Section>
              <Section title={t("startTitle")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {STARTING_POINT.map((s) => (
                    <button key={s.value} type="button" onClick={() => up("start", s.value)} className={card(data.start === s.value)}>{s.label}</button>
                  ))}
                </div>
                {(data.start === "REDO" || data.start === "SYSTEM") && (
                  <Input value={data.currentUrl} onChange={(e) => up("currentUrl", e.target.value)} placeholder={t("currentUrlPlaceholder")} className="mt-3 max-w-md" />
                )}
              </Section>
              <Section title={t("industryTitle")}>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((i) => (
                    <button key={i} type="button" onClick={() => up("industry", data.industry === i ? "" : i)} className={pill(data.industry === i)}>{i}</button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* STEP 1 — solution + phased scope */}
          {step === 1 && (
            <div className="flex flex-col gap-8">
              <Section title={t("solutionTitle")} hint={t("solutionHint")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((s) => {
                    const active = data.services.includes(s.title);
                    return (
                      <button key={s.slug} type="button" onClick={() => toggleIn("services", s.title)} className={cn("flex items-center gap-3", card(active))}>
                        <RegistryIcon name={s.icon} className={cn("size-5 shrink-0", active && "text-accent")} />
                        {s.title}
                      </button>
                    );
                  })}
                </div>
              </Section>
              <Section title={t("featuresTitle")} hint={t("featuresHint")}>
                <div className="flex flex-wrap gap-2">
                  {[...FEATURES, ...customFeatures].map((f) => {
                    const p = data.features[f];
                    return (
                      <button key={f} type="button" onClick={() => cycleFeature(f)} className={cn(pill(!!p), p === "later" && "border-dashed")}>
                        {f}
                        {p && <span className={cn("ml-2 rounded-full px-2 py-0.5 text-xs", p === "now" ? "bg-accent text-white" : "bg-white/10 text-muted-foreground")}>{p === "now" ? t("now") : t("later")}</span>}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  <Input value={customFeature} onChange={(e) => setCustomFeature(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }} placeholder={t("featuresAdd")} className="flex-1" />
                  <Button type="button" variant="outline" onClick={addFeature}><Plus className="size-4" /> {t("add")}</Button>
                </div>
              </Section>
            </div>
          )}

          {/* STEP 2 — what runs it: domain, hosting, add-ons */}
          {step === 2 && (
            <div className="flex flex-col gap-8">
              <Section title={t("domainTitle")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {DOMAIN.map((o) => (
                    <button key={o.value} type="button" onClick={() => up("domainStatus", o.value)} className={card(data.domainStatus === o.value)}>{t(o.key)}</button>
                  ))}
                </div>
                {(data.domainStatus === "HAVE" || data.domainStatus === "SUGGEST") && (
                  <Input value={data.domainName} onChange={(e) => up("domainName", e.target.value)} placeholder={data.domainStatus === "HAVE" ? t("domainPlaceholderHave") : t("domainPlaceholderSuggest")} className="mt-3 max-w-sm" />
                )}
              </Section>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <Section title={t("hostingTitle")}><YesNo value={data.hosting} onChange={(v) => up("hosting", v)} /></Section>
                <Section title={t("logoTitle")}><YesNo value={data.hasLogo} onChange={(v) => up("hasLogo", v)} /></Section>
              </div>
              <Section title={t("addonsTitle")} hint={t("addonsHint")}>
                <div className="flex flex-wrap gap-2">
                  {ADDONS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleIn("addons", a)} className={pill(data.addons.includes(a))}>{a}</button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* STEP 3 — support after launch, budget, timeline */}
          {step === 3 && (
            <div className="flex flex-col gap-8">
              <Section title={t("supportTitle")} hint={t("supportHint")}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {SUPPORT.map((s) => (
                    <button key={s.value} type="button" onClick={() => up("support", s.value)} className={card(data.support === s.value)}>
                      <span className="block text-foreground">{s.value}</span>
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title={t("budgetTitle")}>
                <div className="flex flex-wrap gap-2">
                  {budgets.map((b) => (
                    <button key={b} type="button" onClick={() => up("budget", b)} className={pill(data.budget === b)}>{b}</button>
                  ))}
                </div>
              </Section>
              <Section title={t("timelineTitle")}>
                <div className="flex flex-wrap gap-2">
                  {timelines.map((x) => (
                    <button key={x} type="button" onClick={() => up("timeline", x)} className={pill(data.timeline === x)}>{x}</button>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {/* STEP 4 — contact */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold sm:text-xl">{t("contactTitle")}</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2"><Label htmlFor="q-name">{tf("name")} *</Label><Input id="q-name" required value={data.name} onChange={(e) => up("name", e.target.value)} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="q-email">{tf("email")} *</Label><Input id="q-email" type="email" required value={data.email} onChange={(e) => up("email", e.target.value)} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="q-phone">{tf("phone")}</Label><Input id="q-phone" value={data.phone} onChange={(e) => up("phone", e.target.value)} /></div>
                <div className="flex flex-col gap-2"><Label htmlFor="q-company">{tf("company")}</Label><Input id="q-company" value={data.company} onChange={(e) => up("company", e.target.value)} /></div>
              </div>
              <div className="flex flex-col gap-2"><Label htmlFor="q-about">{t("aboutLabel")}</Label><Textarea id="q-about" rows={2} value={data.about} onChange={(e) => up("about", e.target.value)} placeholder={t("aboutPlaceholder")} /></div>
              <div className="flex flex-col gap-2">
                <Label>{t("refsTitle")}</Label>
                {references.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={v} onChange={(e) => setReferences(references.map((x, idx) => (idx === i ? e.target.value : x)))} placeholder="https://" className="flex-1" />
                    {references.length > 1 && (
                      <button type="button" onClick={() => setReferences(references.filter((_, idx) => idx !== i))} className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted-foreground hover:text-error" aria-label={t("remove")}><X className="size-4" /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setReferences([...references, ""])} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent hover:underline"><Plus className="size-4" /> {t("refsAdd")}</button>
              </div>
              <div className="flex flex-col gap-2"><Label htmlFor="q-notes">{t("notesLabel")}</Label><Textarea id="q-notes" value={data.notes} onChange={(e) => up("notes", e.target.value)} placeholder={t("notesPlaceholder")} /></div>
              {state === "error" && <p className="text-sm text-error">{t("error")}</p>}
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
