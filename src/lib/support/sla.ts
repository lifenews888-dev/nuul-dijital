import { db } from "@/lib/db";

/** First-response SLA in minutes by plan tier. */
const SLA_MINUTES: Record<string, number> = {
  free: 24 * 60,
  starter: 8 * 60,
  basic: 8 * 60,
  pro: 8 * 60,
  team: 8 * 60,
  business: 2 * 60,
  enterprise: 15,
};

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  basic: 1,
  pro: 2,
  team: 2,
  business: 3,
  enterprise: 4,
};

export function slaMinutesForPlan(planKey: string): number {
  return SLA_MINUTES[planKey] ?? SLA_MINUTES.free;
}

export async function resolveOrgSlaPlan(orgId: string): Promise<{
  planKey: string;
  slaMinutes: number;
}> {
  const subs = await db.subscription.findMany({
    where: {
      orgId,
      status: { in: ["ACTIVE", "PAST_DUE", "TRIALING"] },
    },
    select: { planKey: true },
  });

  let bestPlan = "free";
  let bestRank = 0;

  for (const sub of subs) {
    const key = sub.planKey.toLowerCase();
    const rank = PLAN_RANK[key] ?? 0;
    if (rank > bestRank) {
      bestRank = rank;
      bestPlan = key;
    }
  }

  return { planKey: bestPlan, slaMinutes: slaMinutesForPlan(bestPlan) };
}

export function computeSlaDueAt(slaMinutes: number, from = new Date()): Date {
  return new Date(from.getTime() + slaMinutes * 60_000);
}