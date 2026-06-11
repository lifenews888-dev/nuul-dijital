import { Resend } from "resend";
import { siteConfig } from "./site";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = { subject: string; html: string; replyTo?: string; to?: string };

/**
 * Sends a transactional email via Resend.
 * If RESEND_API_KEY is missing (e.g. local dev), it logs instead of failing,
 * so forms still work end-to-end during development.
 * `to` overrides the default inbox (used to email quotes to customers).
 */
export async function sendEmail({ subject, html, replyTo, to }: SendArgs) {
  if (!resend) {
    console.info("[mail] RESEND_API_KEY not set — email skipped:", subject);
    return { skipped: true };
  }
  await resend.emails.send({
    from: process.env.CONTACT_FROM_EMAIL ?? "Nuul Digital <noreply@nuul.digital>",
    to: to ?? process.env.CONTACT_TO_EMAIL ?? siteConfig.email,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
  return { sent: true };
}

export function row(label: string, value?: string | string[]) {
  if (!value || (Array.isArray(value) && value.length === 0)) return "";
  const v = Array.isArray(value) ? value.join(", ") : value;
  return `<tr><td style="padding:6px 12px;color:#666;font-weight:600">${label}</td><td style="padding:6px 12px">${v}</td></tr>`;
}
