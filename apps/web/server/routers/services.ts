import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  publicProcedure,
  protectedProcedure,
  prisma,
} from "@/lib/trpc";

/* ── Admin guard ── */
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Админ эрх шаардлагатай",
    });
  }
  return next({ ctx });
});

export const servicesRouter = router({
  /* ═══════════ PUBLIC ═══════════ */

  getCategories: publicProcedure.query(async () => {
    return prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { _count: { select: { services: true } } },
    });
  }),

  getServices: publicProcedure
    .input(z.object({ categorySlug: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return prisma.service.findMany({
        where: {
          isActive: true,
          ...(input?.categorySlug
            ? { category: { slug: input.categorySlug } }
            : {}),
        },
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
        },
        orderBy: { order: "asc" },
      });
    }),

  getService: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const service = await prisma.service.findUnique({
        where: { id: input.id },
        include: {
          category: true,
        },
      });
      if (!service) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Үйлчилгээ олдсонгүй" });
      }
      return service;
    }),

  /* ═══════════ PROTECTED (user) ═══════════ */

  submitQuote: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(6),
        company: z.string().optional(),
        projectType: z.string().min(1),
        description: z.string().min(10),
        budget: z.string().optional(),
        deadline: z.string().optional(),
        requirements: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = await prisma.service.findUnique({
        where: { id: input.serviceId },
      });
      if (!service) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Үйлчилгээ олдсонгүй" });
      }
      return prisma.serviceQuote.create({
        data: {
          serviceId: input.serviceId,
          userId: ctx.session.user.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          projectType: input.projectType,
          description: input.description,
          budget: input.budget,
          deadline: input.deadline,
          requirements: input.requirements ?? undefined,
        },
      });
    }),

  getUserQuotes: protectedProcedure.query(async ({ ctx }) => {
    return prisma.serviceQuote.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        service: { select: { id: true, name: true, priceLabel: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /* ═══════════ ADMIN ═══════════ */

  adminGetQuotes: adminProcedure
    .input(
      z
        .object({
          status: z
            .enum([
              "PENDING",
              "REVIEWING",
              "QUOTED",
              "ACCEPTED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
            ])
            .optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const where = input?.status ? { status: input.status as any } : {};

      const [quotes, total] = await Promise.all([
        prisma.serviceQuote.findMany({
          where,
          include: {
            service: { select: { id: true, name: true, category: { select: { name: true } } } },
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.serviceQuote.count({ where }),
      ]);

      return { quotes, total, page, totalPages: Math.ceil(total / limit) };
    }),

  adminUpdateQuote: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z
          .enum([
            "PENDING",
            "REVIEWING",
            "QUOTED",
            "ACCEPTED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
          ])
          .optional(),
        agreedPrice: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prisma.serviceQuote.update({
        where: { id: input.id },
        data: {
          ...(input.status ? { status: input.status as any } : {}),
          ...(input.agreedPrice !== undefined
            ? { agreedPrice: input.agreedPrice }
            : {}),
        },
      });
    }),

  adminGetServices: adminProcedure.query(async () => {
    return prisma.service.findMany({
      include: {
        category: { select: { name: true } },
        _count: { select: { quotes: true } },
      },
      orderBy: { order: "asc" },
    });
  }),

  adminGenerateDocs: adminProcedure
    .input(z.object({ quoteId: z.string() }))
    .mutation(async ({ input }) => {
      const quote = await prisma.serviceQuote.findUnique({
        where: { id: input.quoteId },
        include: {
          service: { include: { category: true } },
          user: { select: { name: true, email: true } },
        },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Үнийн санал олдсонгүй" });
      }

      let proposalDoc: string;
      let contractDoc: string;

      const apiKey = process.env.OPENAI_API_KEY;

      if (apiKey) {
        try {
          const { getChatResponse } = await import("@/lib/openai-chat");

          const proposalPrompt = `Generate a professional project proposal in HTML format for:
Client: ${quote.name} (${quote.company ?? "N/A"})
Service: ${quote.service.name}
Category: ${quote.service.category?.name ?? "N/A"}
Project Type: ${quote.projectType}
Description: ${quote.description}
Budget: ${quote.budget ?? "TBD"}
Deadline: ${quote.deadline ?? "TBD"}

Create a professional HTML document with Nuul.digital branding (use #7B6FFF as primary color).
Include sections: Executive Summary, Project Scope, Deliverables, Timeline, Pricing (use budget or service price as reference), Terms & Conditions.
Use professional Mongolian language. Make it look like a real business proposal.
Return ONLY the HTML content (no markdown, no code blocks).`;

          const contractPrompt = `Generate a professional service contract in HTML format for:
Provider: Nuul Digital LLC (Нүүл Дижитал ХХК)
Client: ${quote.name} (${quote.company ?? ""})
Email: ${quote.email}, Phone: ${quote.phone}
Service: ${quote.service.name}
Project Type: ${quote.projectType}
Description: ${quote.description}
Budget: ${quote.budget ?? "TBD"}
Agreed Price: ${quote.agreedPrice ?? quote.budget ?? "TBD"}

Create a professional HTML contract with:
1. Parties (Provider and Client info)
2. Scope of Work
3. Payment Terms: 50% upfront before work begins, 50% upon completion
4. Timeline & Milestones
5. Intellectual Property (all work product transfers to client upon full payment)
6. Confidentiality clause
7. Warranty & Support (30 days post-delivery)
8. Termination clause
9. Signature blocks

Use Nuul.digital branding (#7B6FFF primary color). Professional Mongolian language.
Return ONLY the HTML content (no markdown, no code blocks).`;

          const [proposalResult, contractResult] = await Promise.all([
            getChatResponse([{ role: "user", content: proposalPrompt }]),
            getChatResponse([{ role: "user", content: contractPrompt }]),
          ]);

          proposalDoc = proposalResult;
          contractDoc = contractResult;
        } catch (err) {
          console.error("OpenAI doc generation failed, using template:", err);
          proposalDoc = generateProposalTemplate(quote);
          contractDoc = generateContractTemplate(quote);
        }
      } else {
        proposalDoc = generateProposalTemplate(quote);
        contractDoc = generateContractTemplate(quote);
      }

      return prisma.serviceQuote.update({
        where: { id: input.quoteId },
        data: { proposalDoc, contractDoc },
      });
    }),
});

/* ── Template fallbacks ── */

function generateProposalTemplate(quote: any): string {
  const price = quote.agreedPrice ?? quote.budget ?? "Тохиролцоно";
  return `
<div style="font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a2e;">
  <div style="text-align:center;margin-bottom:40px;border-bottom:3px solid #7B6FFF;padding-bottom:20px;">
    <h1 style="color:#7B6FFF;font-size:28px;margin:0;">nuul<span style="color:#9F98FF">.mn</span></h1>
    <p style="color:#666;margin:5px 0 0;">Нүүл Дижитал ХХК</p>
  </div>
  <h2 style="color:#7B6FFF;text-align:center;font-size:24px;">ТӨСЛИЙН САНАЛ</h2>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:40%;">Үйлчлүүлэгч:</td><td style="padding:8px;border-bottom:1px solid #eee;">${quote.name}${quote.company ? ` (${quote.company})` : ""}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">И-мэйл:</td><td style="padding:8px;border-bottom:1px solid #eee;">${quote.email}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Утас:</td><td style="padding:8px;border-bottom:1px solid #eee;">${quote.phone}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Үйлчилгээ:</td><td style="padding:8px;border-bottom:1px solid #eee;">${quote.service.name}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Төслийн төрөл:</td><td style="padding:8px;border-bottom:1px solid #eee;">${quote.projectType}</td></tr>
  </table>
  <h3 style="color:#7B6FFF;margin-top:30px;">1. Хамрах хүрээ</h3>
  <p>${quote.description}</p>
  <h3 style="color:#7B6FFF;">2. Гүйцэтгэх ажлууд</h3>
  <ul>
    <li>Шаардлага судлах, дизайн зураглал</li>
    <li>Хөгжүүлэлт ба тохиргоо</li>
    <li>Тестчилгээ, засвар</li>
    <li>Хүлээлгэж өгөх, сургалт</li>
  </ul>
  <h3 style="color:#7B6FFF;">3. Хугацаа</h3>
  <p>Хугацаа: ${quote.deadline ?? "Тохиролцоно"}</p>
  <h3 style="color:#7B6FFF;">4. Төлбөр</h3>
  <p style="font-size:20px;font-weight:700;color:#7B6FFF;">${price}${typeof price === "number" ? "₮" : ""}</p>
  <ul>
    <li>50% урьдчилгаа — Гэрээ байгуулсны дараа</li>
    <li>50% үлдэгдэл — Ажил хүлээлгэж өгөх үед</li>
  </ul>
  <h3 style="color:#7B6FFF;">5. Нөхцөл</h3>
  <ul>
    <li>Энэхүү санал 14 хоногийн хүчинтэй.</li>
    <li>Ажил эхлэхийн өмнө гэрээ байгуулна.</li>
    <li>30 хоногийн үнэгүй дэмжлэг.</li>
  </ul>
  <div style="margin-top:40px;padding-top:20px;border-top:2px solid #7B6FFF;text-align:center;color:#888;font-size:12px;">
    <p>Nuul Digital LLC | support@nuul.digital | nuul.digital</p>
  </div>
</div>`;
}

function generateContractTemplate(quote: any): string {
  const price = quote.agreedPrice ?? quote.budget ?? "___________";
  const today = new Date().toISOString().split("T")[0];
  return `
<div style="font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a2e;">
  <div style="text-align:center;margin-bottom:40px;border-bottom:3px solid #7B6FFF;padding-bottom:20px;">
    <h1 style="color:#7B6FFF;font-size:28px;margin:0;">nuul<span style="color:#9F98FF">.mn</span></h1>
    <p style="color:#666;margin:5px 0 0;">Нүүл Дижитал ХХК</p>
  </div>
  <h2 style="text-align:center;font-size:22px;">ҮЙЛЧИЛГЭЭНИЙ ГЭРЭЭ</h2>
  <p style="text-align:center;color:#666;">Огноо: ${today}</p>

  <h3 style="color:#7B6FFF;">1. Талууд</h3>
  <p><strong>Гүйцэтгэгч:</strong> Нүүл Дижитал ХХК (Nuul Digital LLC)<br/>Хаяг: Улаанбаатар хот<br/>И-мэйл: support@nuul.digital</p>
  <p><strong>Захиалагч:</strong> ${quote.name}${quote.company ? ` (${quote.company})` : ""}<br/>И-мэйл: ${quote.email}<br/>Утас: ${quote.phone}</p>

  <h3 style="color:#7B6FFF;">2. Ажлын хамрах хүрээ</h3>
  <p><strong>Үйлчилгээ:</strong> ${quote.service.name}</p>
  <p><strong>Төрөл:</strong> ${quote.projectType}</p>
  <p><strong>Тайлбар:</strong> ${quote.description}</p>

  <h3 style="color:#7B6FFF;">3. Төлбөрийн нөхцөл</h3>
  <p>Нийт дүн: <strong>${price}${typeof price === "number" ? "₮" : ""}</strong></p>
  <ul>
    <li>50% урьдчилгаа — Гэрээ байгуулсны дараа 3 хоногт</li>
    <li>50% үлдэгдэл — Ажил хүлээлгэж өгсний дараа 7 хоногт</li>
  </ul>

  <h3 style="color:#7B6FFF;">4. Хугацаа</h3>
  <p>Хугацаа: ${quote.deadline ?? "Талууд тохиролцоно"}</p>

  <h3 style="color:#7B6FFF;">5. Оюуны өмч</h3>
  <p>Бүх бүтээгдэхүүн, код, дизайн нь бүрэн төлбөр хийгдсэний дараа Захиалагчийн өмч болно.</p>

  <h3 style="color:#7B6FFF;">6. Нууцлал</h3>
  <p>Талууд бие биеийн бизнесийн мэдээллийг нууцлах үүрэг хүлээнэ. Гуравдагч этгээдэд дамжуулахгүй.</p>

  <h3 style="color:#7B6FFF;">7. Баталгаа & Дэмжлэг</h3>
  <p>Хүлээлгэж өгснөөс хойш 30 хоногийн үнэгүй алдаа засварын дэмжлэг.</p>

  <h3 style="color:#7B6FFF;">8. Гэрээ цуцлах</h3>
  <p>Аль нэг тал 14 хоногийн урьдчилсан мэдэгдлээр гэрээг цуцалж болно. Хийгдсэн ажлын төлбөрийг тооцоолно.</p>

  <div style="margin-top:50px;display:flex;justify-content:space-between;">
    <div style="width:45%;">
      <p style="font-weight:600;margin-bottom:50px;">Гүйцэтгэгч:</p>
      <div style="border-bottom:1px solid #333;margin-bottom:5px;"></div>
      <p style="font-size:12px;color:#666;">Нүүл Дижитал ХХК</p>
    </div>
    <div style="width:45%;">
      <p style="font-weight:600;margin-bottom:50px;">Захиалагч:</p>
      <div style="border-bottom:1px solid #333;margin-bottom:5px;"></div>
      <p style="font-size:12px;color:#666;">${quote.name}</p>
    </div>
  </div>

  <div style="margin-top:40px;padding-top:20px;border-top:2px solid #7B6FFF;text-align:center;color:#888;font-size:12px;">
    <p>Nuul Digital LLC | support@nuul.digital | nuul.digital</p>
  </div>
</div>`;
}
