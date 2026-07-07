export type HostingPlanKey = "starter" | "pro" | "business";

export type HostingPlan = {
  key: HostingPlanKey;
  priceMnt: number;
  featured?: boolean;
};

export const HOSTING_PLANS: HostingPlan[] = [
  { key: "starter", priceMnt: 29_000 },
  { key: "pro", priceMnt: 59_000, featured: true },
  { key: "business", priceMnt: 99_000 },
];

export type EmailPlanKey = "basic" | "pro" | "team";

export type EmailPlan = {
  key: EmailPlanKey;
  priceMnt: number;
  featured?: boolean;
};

export const EMAIL_PLANS: EmailPlan[] = [
  { key: "basic", priceMnt: 9_900 },
  { key: "pro", priceMnt: 24_900, featured: true },
  { key: "team", priceMnt: 49_900 },
];