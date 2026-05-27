/**
 * SocialPay Payment Integration for nuul.digital
 *
 * Env vars:
 *   SOCIALPAY_KEY     — merchant terminal key
 *   SOCIALPAY_SECRET  — HMAC secret
 *   SOCIALPAY_ENV     — "production" | "sandbox" (default sandbox)
 */

import crypto from "crypto";

// ── Types ─────────────────────────────────────────────────────────────

export interface SocialPayInvoice {
  invoice: string;
  checksum: string;
  amount: number;
  redirectUrl: string;
}

export interface SocialPayResult {
  success: boolean;
  invoice: string;
  amount: number;
  transactionId?: string;
  errorMessage?: string;
}

export interface SocialPayCallbackData {
  invoice: string;
  status: string;
  amount: number;
  transactionId?: string;
  checksum: string;
}

// ── Config ────────────────────────────────────────────────────────────

const SOCIALPAY_BASE =
  process.env.SOCIALPAY_ENV === "production"
    ? "https://ecommerce.golomtbank.com/api"
    : "https://ecommerce-test.golomtbank.com/api";

// ── Helpers ───────────────────────────────────────────────────────────

function generateChecksum(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
}

// ── Create Invoice ────────────────────────────────────────────────────

export async function createSocialPayInvoice(params: {
  orderId: string;
  amount: number;
  description: string;
}): Promise<SocialPayInvoice> {
  const key = process.env.SOCIALPAY_KEY;
  const secret = process.env.SOCIALPAY_SECRET;

  const timestamp = Date.now();
  const invoice = `NUUL-${params.orderId}-${timestamp}`;

  // If env vars not set, return mock data for development
  if (!key || !secret) {
    console.warn("[SOCIALPAY] SOCIALPAY_KEY / SOCIALPAY_SECRET тохируулаагүй — mock горимд ажиллаж байна");
    const mockChecksum = generateChecksum(
      `${invoice}${params.amount}`,
      "mock-secret"
    );
    return {
      invoice,
      checksum: mockChecksum,
      amount: params.amount,
      redirectUrl: `${SOCIALPAY_BASE}/pay?invoice=${invoice}&amount=${params.amount}&checksum=${mockChecksum}`,
    };
  }

  const checksumData = `${key}${invoice}${params.amount}`;
  const checksum = generateChecksum(checksumData, secret);

  const callbackUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/payments/socialpay/callback`;

  const redirectUrl = `${SOCIALPAY_BASE}/pay?terminal=${key}&invoice=${invoice}&amount=${params.amount}&checksum=${checksum}&callback=${encodeURIComponent(callbackUrl)}&description=${encodeURIComponent(params.description)}`;

  return {
    invoice,
    checksum,
    amount: params.amount,
    redirectUrl,
  };
}

// ── Verify Callback ──────────────────────────────────────────────────

export function verifySocialPayCallback(data: SocialPayCallbackData): boolean {
  const key = process.env.SOCIALPAY_KEY;
  const secret = process.env.SOCIALPAY_SECRET;

  if (!key || !secret) {
    // In mock mode, always return true for development
    console.warn("[SOCIALPAY] Mock горим — callback баталгаажуулалтыг алгаслаа");
    return true;
  }

  const checksumData = `${key}${data.invoice}${data.amount}${data.status}`;
  const expectedChecksum = generateChecksum(checksumData, secret);

  return data.checksum === expectedChecksum;
}
