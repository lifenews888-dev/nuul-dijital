import { createHmac, timingSafeEqual } from "crypto";
import { parseCookie } from "@/lib/domains/journey";

export const ORDER_LOOKUP_COOKIE = "nuul_order_lookup";
export const ORDER_LOOKUP_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

type TokenPayload = {
  email: string;
  exp: number;
  type: "magic" | "session" | "password-reset";
};

function getSecret(): string {
  const secret = process.env.ORDER_LOOKUP_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ORDER_LOOKUP_SECRET or AUTH_SECRET is required");
    }
    return "dev-order-lookup-secret";
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeToken(payload: string): string {
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function decodeToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return payload;
}

function parsePayload(raw: string): TokenPayload | null {
  try {
    const data = JSON.parse(raw) as TokenPayload;
    if (!data.email || typeof data.exp !== "number" || !data.type) return null;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function normalizeLookupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createMagicLinkToken(email: string): string {
  const payload: TokenPayload = {
    email: normalizeLookupEmail(email),
    exp: Date.now() + MAGIC_LINK_TTL_MS,
    type: "magic",
  };
  return encodeToken(JSON.stringify(payload));
}

export function verifyMagicLinkToken(token: string): string | null {
  const raw = decodeToken(token);
  if (!raw) return null;
  const data = parsePayload(raw);
  if (!data || data.type !== "magic") return null;
  return data.email;
}

export function createSessionToken(email: string): string {
  const payload: TokenPayload = {
    email: normalizeLookupEmail(email),
    exp: Date.now() + ORDER_LOOKUP_COOKIE_MAX_AGE * 1000,
    type: "session",
  };
  return encodeToken(JSON.stringify(payload));
}

export function createPasswordResetToken(email: string): string {
  const payload: TokenPayload = {
    email: normalizeLookupEmail(email),
    exp: Date.now() + PASSWORD_RESET_TTL_MS,
    type: "password-reset",
  };
  return encodeToken(JSON.stringify(payload));
}

export function verifyPasswordResetToken(token: string): string | null {
  const raw = decodeToken(token);
  if (!raw) return null;
  const data = parsePayload(raw);
  if (!data || data.type !== "password-reset") return null;
  return data.email;
}

export function verifySessionToken(token: string): string | null {
  const raw = decodeToken(token);
  if (!raw) return null;
  const data = parsePayload(raw);
  if (!data || data.type !== "session") return null;
  return data.email;
}

export function orderLookupCookieHeader(sessionToken: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ORDER_LOOKUP_COOKIE}=${encodeURIComponent(sessionToken)}; Path=/; Max-Age=${ORDER_LOOKUP_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`;
}

export function clearOrderLookupCookieHeader(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ORDER_LOOKUP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly${secure}`;
}

export function readOrderLookupEmail(req: Request): string | null {
  const token = parseCookie(req, ORDER_LOOKUP_COOKIE);
  if (!token) return null;
  return verifySessionToken(token);
}