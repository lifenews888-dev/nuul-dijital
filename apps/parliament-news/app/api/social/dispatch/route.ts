import { dispatchSocial } from "../../../../lib/social-dispatch";

/**
 * Сошиал дарааллыг илгээх ажиллагаа — Vercel Cron дуудна.
 *
 * Нууц үггүй бол 404: тохируулаагүй үед энэ зам БАЙХГҮЙ байх ёстой.
 * 401 буцаавал «энд ямар нэг зүйл бий» гэдгийг хэлнэ; 404 нь юу ч
 * хэлэхгүй.
 *
 * Vercel Cron нь `Authorization: Bearer <CRON_SECRET>` илгээдэг.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.SOCIAL_DISPATCH_SECRET?.trim();
  if (!secret) return new Response("Not found", { status: 404 });

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) return new Response("Not found", { status: 404 });

  const report = await dispatchSocial();
  return Response.json(report);
}
