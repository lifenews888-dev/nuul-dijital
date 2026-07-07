/**
 * Pre-GA deploy verification for the Domains module.
 * Usage: npm run verify:domains-deploy
 * Optional: BASE_URL=https://nuul.digital npm run verify:domains-deploy
 */

import { checkRateLimitBackend } from "../src/lib/rate-limit-health";

const BASE = process.env.BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

type Check = { name: string; ok: boolean; detail?: string };

async function fetchJson(path: string): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, body };
}

async function main() {
  const checks: Check[] = [];

  // Env vars
  const required = [
    "DATABASE_URL",
    "RESEND_API_KEY",
    "CRON_SECRET",
    "QPAY_USERNAME",
    "QPAY_PASSWORD",
    "QPAY_INVOICE_CODE",
  ] as const;

  for (const key of required) {
    checks.push({
      name: `env:${key}`,
      ok: Boolean(process.env[key]?.trim()),
      detail: process.env[key] ? "set" : "missing",
    });
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  checks.push({
    name: "env:UPSTASH",
    ok: Boolean(upstashUrl && upstashToken),
    detail: upstashUrl && upstashToken ? "configured" : "missing (GA blocker)",
  });

  // Local Upstash probe (when env present)
  if (upstashUrl && upstashToken) {
    const rl = await checkRateLimitBackend();
    checks.push({
      name: "upstash:probe",
      ok: rl.ok,
      detail: rl.error ?? rl.backend,
    });
  }

  // HTTP health endpoints
  try {
    const rateLimit = await fetchJson("/api/health/rate-limit");
    checks.push({
      name: "GET /api/health/rate-limit",
      ok: rateLimit.status === 200 && rateLimit.body.ok === true,
      detail: `status=${rateLimit.status}`,
    });
  } catch (err) {
    checks.push({
      name: "GET /api/health/rate-limit",
      ok: false,
      detail: err instanceof Error ? err.message : "fetch failed",
    });
  }

  try {
    const legal = await fetch(`${BASE}/mn/legal/domain-registration`, { cache: "no-store" });
    checks.push({
      name: "GET /legal/domain-registration",
      ok: legal.status === 200,
      detail: `status=${legal.status}`,
    });
  } catch (err) {
    checks.push({
      name: "GET /legal/domain-registration",
      ok: false,
      detail: err instanceof Error ? err.message : "fetch failed",
    });
  }

  try {
    const cronSecret = process.env.CRON_SECRET?.trim();
    const cronRes = await fetch(`${BASE}/api/cron/domains/expire-payments`, {
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
      cache: "no-store",
    });
    checks.push({
      name: "GET /api/cron/domains/expire-payments",
      ok: cronRes.status === 200,
      detail: cronSecret ? `status=${cronRes.status}` : "CRON_SECRET missing — skipped auth",
    });
  } catch (err) {
    checks.push({
      name: "GET /api/cron/domains/expire-payments",
      ok: false,
      detail: err instanceof Error ? err.message : "fetch failed",
    });
  }

  console.log(`\nDomains deploy verification — ${BASE}\n`);
  let failed = 0;
  for (const c of checks) {
    const mark = c.ok ? "✓" : "✗";
    if (!c.ok) failed++;
    console.log(`  ${mark} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
  }

  console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} check(s) failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});