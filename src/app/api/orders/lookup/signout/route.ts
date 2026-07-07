import { NextResponse } from "next/server";
import { clearOrderLookupCookieHeader } from "@/lib/domains/order-lookup";
import { guardMutation } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { response } = await guardMutation(req, {
    key: "order-lookup-signout",
    limit: 10,
    windowMs: 60_000,
  });
  if (response) return response;

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearOrderLookupCookieHeader());
  return res;
}