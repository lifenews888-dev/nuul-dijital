import { NextResponse } from "next/server";
import { z } from "zod";
import { guardMutation } from "@/lib/security";
import { persist } from "@/lib/persist";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().min(6).max(64).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(20),
});

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(?:\+?976[\s-]?)?\d{8}/;

const SYSTEM = `Чи бол "Nuul Digital" — Монголын дижитал агентлагийн AI туслах.
Зорилго: зочдод үйлчилгээ, үнэ, үйл явцын талаар Монголоор товч, найрсаг, тус дөхөмтэй хариулах.

ҮЙЛЧИЛГЭЭ: Вэб хөгжүүлэлт, AI чатбот, бизнес автоматжуулалт, E-commerce, Мобайл апп, UI/UX дизайн, Брэндинг, Cloud дэд бүтэц, Дижитал маркетинг.
ОЙРОЛЦОО ҮНЭ (төслөөс хамаарна): Вэб 3–8 сая₮, E-commerce 6–18 сая₮, Мобайл апп 10–30 сая₮, AI чатбот 4–12 сая₮.
ҮЙЛ ЯВЦ: Судалгаа → Дизайн → Хөгжүүлэлт → Нэвтрүүлэлт → Өсөлт.
ХОЛБОО: утас +976 7700 0000, имэйл hello@nuul.digital.

ДҮРЭМ:
- Богино, тодорхой хариул (2-4 өгүүлбэр). Маркетингийн хэт урт яриа бүү хий.
- Үнэ асуувал ойролцоо хязгаарыг хэлээд, "дэлгэрэнгүй санал авах бол /quote хуудсанд бриф бөглөөрэй" гэж урь.
- Холбоо барих/уулзах бол /contact эсвэл утсаар холбогдохыг санал болго.
- Хариу мэдэхгүй бол hello@nuul.digital руу чиглүүл.
- Зөвхөн Nuul Digital-тэй холбоотой асуултад төвлөр.`;

// Knowledge-based fallback when no LLM key is configured.
function fallbackReply(text: string): string {
  const t = text.toLowerCase();
  if (/(үн[эе]|төсөв|хэдэн төгрөг|ханш|price|cost)/.test(t))
    return "Үнэ төслийн хүрээнээс хамаарна: вэбсайт 3–8 сая₮, E-commerce 6–18 сая₮, мобайл апп 10–30 сая₮, AI чатбот 4–12 сая₮ орчим. Тодорхой санал авахыг хүсвэл /quote хуудсанд хэдхэн алхамд бриф бөглөөрэй — бид 24 цагт хариулна.";
  if (/(холбо|утас|имэйл|уулз|contact|meet)/.test(t))
    return "Бидэнтэй холбогдох: утас +976 7700 0000, имэйл hello@nuul.digital. Эсвэл /contact хуудсаар зурвас үлдээх, уулзалт захиалах боломжтой.";
  if (/(чатбот|ai|хиймэл|автомат|automation)/.test(t))
    return "Бид Монгол хэл ойлгодог AI чатбот болон бизнес автоматжуулалтын шийдэл хийдэг — харилцагчийн үйлчилгээ, лид хураалт, давтагдах ажлыг автоматжуулна. Дэлгэрэнгүйг /services/ai-chatbots дээр үзээрэй.";
  if (/(вэб|сайт|web|e-?commerce|худалд|апп|app|mobile)/.test(t))
    return "Бид Next.js дээр хурдан, аюулгүй вэбсайт, e-commerce, мобайл апп хөгжүүлдэг. Ямар төсөл сонирхож байгаагаа хэлбэл тохирох шийдэл, ойролцоо үнийг хэлж өгье. Эсвэл /quote дээр бриф бөглөөрэй.";
  if (/(сайн|hello|hi|байна уу|өдрийн мэнд)/.test(t))
    return "Сайн байна уу! 👋 Би Nuul Digital-ийн AI туслах. Үйлчилгээ, үнэ, эсвэл төслийн талаар асуугаарай — туслахдаа баяртай байна.";
  return "Сонирхсон асуултаа дэлгэрэнгүй бичээрэй — үйлчилгээ, үнэ, хугацааны талаар хэлж өгье. Эсвэл /quote дээр бриф бөглөвөл бид 24 цагт тодорхой санал илгээнэ.";
}

async function callAnthropic(messages: { role: string; content: string }[]): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 400, system: SYSTEM, messages }),
  });
  if (!res.ok) {
    console.error("[chat] anthropic", res.status, await res.text());
    return null;
  }
  const j = await res.json();
  return j?.content?.[0]?.text ?? null;
}

async function callOpenAI(messages: { role: string; content: string }[]): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
    }),
  });
  if (!res.ok) {
    console.error("[chat] openai", res.status, await res.text());
    return null;
  }
  const j = await res.json();
  return j?.choices?.[0]?.message?.content ?? null;
}

export async function POST(req: Request) {
  const { response } = guardMutation(req, { key: "chat", limit: 30, windowMs: 60_000 });
  if (response) return response;

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    // Anthropic requires the first message to be from the user.
    const messages = parsed.data.messages.slice(-10);
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) return NextResponse.json({ reply: fallbackReply("") });

    const last = messages[messages.length - 1].content;
    const reply =
      (await callAnthropic(messages).catch(() => null)) ??
      (await callOpenAI(messages).catch(() => null)) ??
      fallbackReply(last);

    // Persist the exchange (best-effort) so admins can review conversations & capture leads.
    const sessionId = parsed.data.sessionId;
    if (sessionId) {
      const email = last.match(EMAIL_RE)?.[0];
      const phone = last.match(PHONE_RE)?.[0];
      await persist((db) =>
        db.chatSession.upsert({
          where: { id: sessionId },
          create: {
            id: sessionId,
            userAgent: req.headers.get("user-agent")?.slice(0, 255),
            messageCount: 2,
            email,
            phone,
            messages: {
              create: [
                { role: "user", content: last },
                { role: "assistant", content: reply },
              ],
            },
          },
          update: {
            messageCount: { increment: 2 },
            ...(email ? { email } : {}),
            ...(phone ? { phone } : {}),
            messages: {
              create: [
                { role: "user", content: last },
                { role: "assistant", content: reply },
              ],
            },
          },
        })
      );
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ reply: "Уучлаарай, түр алдаа гарлаа. Дахин оролдоно уу эсвэл hello@nuul.digital руу холбогдоорой." });
  }
}
