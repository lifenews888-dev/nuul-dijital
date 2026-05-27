import OpenAI from "openai";

const NUUL_SYSTEM_PROMPT = `Та Nuul.digital платформын AI туслах юм. Монгол хэлээр хариулна уу.
Nuul.digital-ийн үйлчилгээнүүд:
- Домэйн бүртгэл (.mn ₮165,000, .com ₮62,500, .org ₮75,000)
- Вэб хостинг (Starter ₮99,000, Business ₮249,000/сар)
- Вэбсайт Builder (drag & drop)
- AI Чатбот Builder
- CRM систем
- Call Center 24/7
- И-мэйл маркетинг
- QPay/SocialPay төлбөр

Техникийн асуудалд: 503 алдаа: nginx restart, SSL: certbot renew, Удаан вэбсайт: cache + WebP зураг, DNS: 24-48 цагт тархана.
Хариултыг товч, тодорхой, найрсаг байлгана уу. Мэдэхгүй бол "Манай дэмжлэгийн багтай холбогдоно уу" гэж хэлнэ.`;

export { NUUL_SYSTEM_PROMPT };

/* ─── OpenAI-powered response ─── */

export async function getChatResponse(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Use rule-based fallback
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    return getRuleBasedResponse(lastUserMsg?.content ?? "");
  }

  try {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: NUUL_SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return (
      completion.choices[0]?.message?.content ??
      "Уучлаарай, хариулт үүсгэж чадсангүй. Дахин оролдоно уу."
    );
  } catch (error) {
    console.error("OpenAI API error:", error);
    // Fall back to rule-based if OpenAI fails
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    return getRuleBasedResponse(lastUserMsg?.content ?? "");
  }
}

/* ─── Rule-based fallback ─── */

interface Rule {
  patterns: string[];
  response: string;
}

const rules: Rule[] = [
  {
    patterns: ["домэйн", "домейн", "domain", ".mn", ".com", ".org"],
    response:
      "Домэйн бүртгүүлэхийн тулд Домэйн захиалах хэсэг рүү орно уу.\n\n**Үнэ:**\n• .mn домэйн — ₮165,000/жил\n• .com домэйн — ₮62,500/жил\n• .org домэйн — ₮75,000/жил\n\nДомэйн хайлт хийж, боломжтой домэйнаа шалгаарай! Хэрэв домэйн шилжүүлэх бол transfer код шаардлагатай.",
  },
  {
    patterns: ["хостинг", "сервер", "hosting", "server", "план"],
    response:
      "Бид 3 хостинг план санал болгодог:\n\n• **Starter** — ₮99,000/сар (1 домэйн, 5GB хадгалах, SSL үнэгүй)\n• **Business** — ₮249,000/сар (5 домэйн, 25GB, AI чатбот, и-мэйл)\n• **Enterprise** — Тусгай тохиролцоо (тусгай хэрэгцээнд)\n\nБүх планд 99.9% uptime баталгаа, автомат backup, 24/7 дэмжлэг багтсан. Хостинг хуудас руу орж дэлгэрэнгүй харна уу.",
  },
  {
    patterns: ["төлбөр", "qpay", "socialpay", "мөнгө", "үнэ", "төлөх", "payment"],
    response:
      "Бид дараах төлбөрийн сувгуудыг дэмждэг:\n\n• **QPay** — QR код уншуулж шууд төлөх\n• **SocialPay** — Аппаар төлөх\n\nНэхэмжлэх & Төлбөр хэсэгт орж QPay QR код үүсгэж төлбөрөө хийгээрэй. Төлбөр 1-2 минутын дотор автоматаар баталгаажна. Буцаан олголт хүсвэл тикет үүсгэнэ үү.",
  },
  {
    patterns: ["чатбот", "chatbot", "бот", "bot", "автомат хариулт"],
    response:
      "AI Чатбот Builder ашиглан олон платформ дээр монгол хэлтэй чатбот үүсгэж болно:\n\n• **Facebook Messenger** — Хуудасны автомат хариулт\n• **Вэбсайт** — Widget суулгах (1 мөр код)\n• **Viber** — Viber бот\n• **Telegram** — Telegram бот\n\n94% хүртэл хариултыг автоматаар хариулдаг. Dashboard > AI Чатбот Builder хэсэг рүү орж эхлээрэй!",
  },
  {
    patterns: ["crm", "борлуулалт", "lead", "лийд", "pipeline"],
    response:
      "CRM & Борлуулалт хэсэгт:\n\n• **Kanban board** — Lead-үүдийг stage-ээр удирдах\n• Lead нэмэх, утас/имэйл хадгалах\n• Pipeline шатлал: Шинэ → Холбоо барьсан → Санал илгээсэн → Хэлэлцээр → Хаагдсан\n• Борлуулалтын тайлан, дүн шинжилгээ\n\nDashboard > CRM хэсэг рүү орно уу.",
  },
  {
    patterns: ["ssl", "сертификат", "https", "certificate"],
    response:
      "SSL сертификат бүх хостинг планд **үнэгүй** багтдаг!\n\n• Let's Encrypt SSL автоматаар суулгагдана\n• 90 хоног тутам автомат шинэчлэлт\n• Хэрэв SSL алдаа гарвал: `certbot renew` командаар шинэчлэх\n• Mixed content алдаа: Бүх URL-ийг https:// болгох\n\nАсуудал шийдэгдэхгүй бол тикет үүсгэнэ үү.",
  },
  {
    patterns: ["dns", "nameserver", "a record", "cname", "mx"],
    response:
      "DNS тохиргоог домэйн удирдлагын хэсгээс хийж болно:\n\n• **A record** — Домэйнийг IP руу чиглүүлэх\n• **CNAME** — Домэйнийг өөр домэйн руу чиглүүлэх\n• **MX record** — И-мэйл серверийн тохиргоо\n• **TXT record** — SPF, DKIM, баталгаажуулалт\n\nӨөрчлөлт 24-48 цагийн дотор бүрэн тархана. Яаралтай бол TTL-ийг 300 секунд болгоорой.",
  },
  {
    patterns: ["503", "алдаа", "error", "ажиллахгүй", "унасан", "down"],
    response:
      "Техникийн асуудал шийдэх заавар:\n\n• **503 алдаа** — nginx эсвэл серверийг restart хийх\n• **500 алдаа** — Серверийн лог шалгах (error.log)\n• **404 алдаа** — URL зам буруу эсвэл файл байхгүй\n• **Вэбсайт удаан** — Cache идэвхжүүлэх, зургийг WebP формат руу хөрвүүлэх\n\nАсуудал үргэлжилбэл тикет үүсгэж манай багт мэдэгдээрэй.",
  },
  {
    patterns: ["удаан", "хурд", "slow", "speed", "оптимизац"],
    response:
      "Вэбсайтын хурдыг сайжруулах арга:\n\n1. **Cache** идэвхжүүлэх (Browser + Server cache)\n2. Зургийг **WebP** формат руу хөрвүүлэх\n3. CSS/JS файлуудыг **minify** хийх\n4. **CDN** ашиглах (CloudFlare үнэгүй)\n5. Шаардлагагүй plugin устгах\n\nBusiness план дээр бид автомат оптимизаци хийж өгдөг.",
  },
  {
    patterns: ["имэйл", "email", "мэйл", "маркетинг", "newsletter"],
    response:
      "И-мэйл маркетингийн боломжууд:\n\n• Бөөнөөр и-мэйл илгээх\n• Template builder (drag & drop)\n• Автомат дараалал (welcome, follow-up)\n• Нээсэн/дарсан статистик\n• Subscriber удирдлага\n\nBusiness план дээр и-мэйл маркетинг багтсан. Dashboard > И-мэйл маркетинг хэсэг рүү орно уу.",
  },
  {
    patterns: ["builder", "вэбсайт", "website", "сайт", "хуудас"],
    response:
      "Nuul Вэбсайт Builder ашиглан код бичихгүйгээр мэргэжлийн вэбсайт үүсгээрэй:\n\n• **Drag & drop** засварлагч\n• 50+ загвар (template)\n• Мобайл responsive\n• SEO оптимизаци\n• QPay/SocialPay интеграци\n\nDashboard > Вэбсайт Builder хэсэг рүү орж эхлээрэй!",
  },
  {
    patterns: ["сайн байна", "hello", "hi", "сайн уу", "мэнд"],
    response:
      "Сайн байна уу! Nuul.digital-д тавтай морил. Би танд дараах сэдвүүдээр тусалж чадна:\n\n• Домэйн бүртгэл\n• Хостинг үйлчилгээ\n• Вэбсайт Builder\n• AI Чатбот\n• Төлбөр & QPay\n• Техникийн дэмжлэг\n\nЯмар асуулт байна?",
  },
  {
    patterns: ["баярлалаа", "гоё", "харилаа", "ойлголоо", "thanks", "thank"],
    response:
      "Зүгээр дээ! Өөр асуулт байвал бичээрэй. Бид 24/7 тусалхад бэлэн. 😊",
  },
  {
    patterns: ["холбоо", "утас", "хаяг", "contact", "phone"],
    response:
      "Бидэнтэй холбогдох:\n\n• И-мэйл: support@nuul.digital\n• Утас: 7700-0000\n• Хаяг: Улаанбаатар хот\n• Ажлын цаг: 24/7 онлайн дэмжлэг\n\nЭсвэл тикет үүсгэж шууд манай багтай холбогдоорой!",
  },
  {
    patterns: ["бүртгэл", "register", "нэвтрэх", "login", "нууц үг", "password"],
    response:
      "Бүртгэлийн тусламж:\n\n• **Шинэ бүртгэл** — Нүүр хуудас > Бүртгүүлэх\n• **Нэвтрэх** — Google эсвэл имэйл/нууц үгээр\n• **Нууц үг мартсан** — Нэвтрэх хуудас > Нууц үг сэргээх\n\nАсуудал гарвал support@nuul.digital руу бичнэ үү.",
  },
];

export function getRuleBasedResponse(message: string): string {
  const msg = message.toLowerCase();

  // Check each rule for pattern matches
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (msg.includes(pattern.toLowerCase())) {
        return rule.response;
      }
    }
  }

  // Default fallback
  return "Баярлалаа! Таны асуултыг хүлээн авлаа. Дэлгэрэнгүй тусламж авахыг хүсвэл доорх сэдвүүдийн аль нэгийг сонгоно уу:\n\n• Домэйн бүртгэл\n• Хостинг үйлчилгээ\n• Төлбөр & QPay\n• AI Чатбот\n• CRM борлуулалт\n• SSL сертификат\n• DNS тохиргоо\n• Вэбсайт Builder\n\nЭсвэл тикет үүсгэж манай багтай холбогдоно уу.";
}
