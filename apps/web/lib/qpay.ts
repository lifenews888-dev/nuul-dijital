/**
 * QPay v2 Payment Integration for nuul.digital
 *
 * Env vars:
 *   QPAY_USERNAME       — merchant username
 *   QPAY_PASSWORD       — merchant password
 *   QPAY_INVOICE_CODE   — invoice template code
 *   QPAY_ENV            — "production" | "sandbox" (default sandbox)
 */

// ── Types ─────────────────────────────────────────────────────────────

export interface QPayToken {
  token_type: string;
  refresh_expires_in: number;
  refresh_token: string;
  access_token: string;
  expires_in: number;
}

export interface QPayInvoice {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // base64
  qPay_shortUrl: string;
  urls: Array<{
    name: string;
    description: string;
    logo: string;
    link: string;
  }>;
}

export interface QPayPaymentRow {
  payment_id: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_wallet: string;
  transaction_id: string;
}

export interface QPayCheckResponse {
  count: number;
  paid_amount: number;
  rows: QPayPaymentRow[];
}

// ── Config ────────────────────────────────────────────────────────────

const QPAY_BASE =
  process.env.QPAY_ENV === "production"
    ? "https://merchant.qpay.mn/v2"
    : "https://merchant-sandbox.qpay.mn/v2";

// ── Token cache ───────────────────────────────────────────────────────

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getQPayToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;

  if (!username || !password) {
    throw new Error("QPAY_USERNAME / QPAY_PASSWORD тохируулаагүй байна");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  const res = await fetch(`${QPAY_BASE}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`QPay auth алдаа: ${res.status} — ${text}`);
  }

  const data: QPayToken = await res.json();

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
  };

  return data.access_token;
}

// ── Create Invoice ────────────────────────────────────────────────────

export async function createInvoice(params: {
  orderId: string;
  amount: number;
  description: string;
  callbackUrl: string;
}): Promise<QPayInvoice> {
  const token = await getQPayToken();
  const invoiceCode = process.env.QPAY_INVOICE_CODE;

  if (!invoiceCode) {
    throw new Error("QPAY_INVOICE_CODE тохируулаагүй байна");
  }

  const res = await fetch(`${QPAY_BASE}/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      invoice_code: invoiceCode,
      sender_invoice_no: params.orderId,
      invoice_receiver_code: "terminal",
      invoice_description: params.description,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`QPay нэхэмжлэх үүсгэхэд алдаа: ${res.status} — ${text}`);
  }

  return res.json();
}

// ── Check Payment ─────────────────────────────────────────────────────

export async function checkPayment(invoiceId: string): Promise<QPayCheckResponse> {
  const token = await getQPayToken();

  const res = await fetch(`${QPAY_BASE}/payment/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`QPay төлбөр шалгахад алдаа: ${res.status} — ${text}`);
  }

  return res.json();
}

// ── Cancel Invoice ────────────────────────────────────────────────────

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const token = await getQPayToken();

  const res = await fetch(`${QPAY_BASE}/invoice/${invoiceId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`QPay нэхэмжлэх цуцлахад алдаа: ${res.status} — ${text}`);
  }
}
