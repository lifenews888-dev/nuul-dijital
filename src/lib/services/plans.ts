import type { ServiceType } from "@prisma/client";
import { EMAIL_PLANS, HOSTING_PLANS } from "@/data/hosting-plans";

export type ResolvedServicePlan = {
  key: string;
  priceMnt: number;
  featured?: boolean;
};

export function resolveServicePlan(
  serviceType: ServiceType,
  planKey: string
): ResolvedServicePlan | null {
  const plans = serviceType === "HOSTING" ? HOSTING_PLANS : EMAIL_PLANS;
  const plan = plans.find((p) => p.key === planKey);
  if (!plan) return null;
  return { key: plan.key, priceMnt: plan.priceMnt, featured: plan.featured };
}

export function listServicePlanKeys(serviceType: ServiceType): string[] {
  const plans = serviceType === "HOSTING" ? HOSTING_PLANS : EMAIL_PLANS;
  return plans.map((p) => p.key);
}