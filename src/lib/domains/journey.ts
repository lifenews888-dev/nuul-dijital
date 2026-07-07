import { createHash, randomUUID } from "crypto";
import { db } from "@/lib/db";
import type { OnboardingJourney } from "@prisma/client";

export const JOURNEY_COOKIE = "nuul_journey";
export const JOURNEY_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export function parseCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (key === name) return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return undefined;
}

export function journeyCookieHeader(sessionKey: string): string {
  return `${JOURNEY_COOKIE}=${encodeURIComponent(sessionKey)}; Path=/; Max-Age=${JOURNEY_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly`;
}

export async function getOrCreateJourney(
  sessionKey: string,
  locale?: string
): Promise<OnboardingJourney> {
  return db.onboardingJourney.upsert({
    where: { sessionKey },
    create: {
      sessionKey,
      metadata: locale ? { locale } : undefined,
    },
    update: {},
  });
}

export type ResolvedJourney = {
  journey: OnboardingJourney;
  sessionKey: string;
  setCookie: boolean;
};

/**
 * Resolve journey from explicit id or session cookie; create cookie session if missing.
 */
export async function resolveJourney(
  req: Request,
  journeyId?: string,
  locale?: string
): Promise<ResolvedJourney | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    if (journeyId) {
      const existing = await db.onboardingJourney.findUnique({ where: { id: journeyId } });
      if (existing) {
        return { journey: existing, sessionKey: existing.sessionKey, setCookie: false };
      }
    }

    let sessionKey = parseCookie(req, JOURNEY_COOKIE);
    const isNew = !sessionKey;
    if (!sessionKey) sessionKey = randomUUID();

    const journey = await getOrCreateJourney(sessionKey, locale);
    return { journey, sessionKey, setCookie: isNew };
  } catch (err) {
    console.error("[journey] resolve failed:", err);
    return null;
  }
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}