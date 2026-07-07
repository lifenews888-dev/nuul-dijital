import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations>;

export function buildPlanLabels(
  t: Translator,
  namespace: "hostingPlans" | "emailPlans",
  keys: string[]
): Record<string, { name: string; features: string[] }> {
  const out: Record<string, { name: string; features: string[] }> = {};
  for (const key of keys) {
    out[key] = {
      name: t(`${namespace}.${key}.name`),
      features: t.raw(`${namespace}.${key}.features`) as string[],
    };
  }
  return out;
}