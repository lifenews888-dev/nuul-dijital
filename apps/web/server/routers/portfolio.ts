import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { router, publicProcedure, protectedProcedure, prisma } from "@/lib/trpc";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Админ эрх шаардлагатай",
    });
  }
  return next({ ctx });
});

const STATUSES = ["LIVE", "SOON", "DRAFT"] as const;

const baseFields = {
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  coverImage: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  status: z.enum(STATUSES).default("LIVE"),
  gradient: z.string().default("from-[#7B6FFF]/30 via-[#7B6FFF]/10 to-transparent"),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
};

export const portfolioRouter = router({
  // ── Public ──────────────────────────────────────────────────────
  list: publicProcedure.query(async () => {
    return prisma.portfolio.findMany({
      where: { isActive: true, status: { in: ["LIVE", "SOON"] } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  }),

  // ── Admin ───────────────────────────────────────────────────────
  adminList: adminProcedure.query(async () => {
    return prisma.portfolio.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  }),

  adminGet: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.portfolio.findUnique({ where: { id: input.id } });
    }),

  adminCreate: adminProcedure
    .input(z.object(baseFields))
    .mutation(async ({ input }) => {
      const result = await prisma.portfolio.create({ data: input });
      revalidatePath("/");
      return result;
    }),

  adminUpdate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        coverImage: z.string().optional().nullable(),
        link: z.string().optional().nullable(),
        status: z.enum(STATUSES).optional(),
        gradient: z.string().optional(),
        order: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await prisma.portfolio.update({ where: { id }, data });
      revalidatePath("/");
      return result;
    }),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await prisma.portfolio.delete({ where: { id: input.id } });
      revalidatePath("/");
      return result;
    }),

  adminSeedDefaults: adminProcedure.mutation(async () => {
    const count = await prisma.portfolio.count();
    if (count > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Portfolio аль хэдийн бүртгэгдсэн байна",
      });
    }
    await prisma.portfolio.createMany({
      data: [
        {
          title: "Yria.mn",
          category: "AI Чатбот платформ",
          description: "Монгол хэлтэй чатбот барих платформ. Facebook, Web, Viber-д суурилуулах.",
          link: "https://yria.mn",
          status: "LIVE",
          gradient: "from-[#7B6FFF]/30 via-[#7B6FFF]/10 to-transparent",
          order: 1,
        },
        {
          title: "Nuul.digital",
          category: "Агентлагийн платформ",
          description: "Маркетинг агентлагийн вэб платформ — таны үзэж буй сайт өөрөө.",
          link: "/",
          status: "LIVE",
          gradient: "from-[#00E5B8]/30 via-[#00E5B8]/10 to-transparent",
          order: 2,
        },
      ],
    });
    revalidatePath("/");
    return { ok: true };
  }),
});
