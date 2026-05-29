import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { router, publicProcedure, protectedProcedure, prisma } from "@/lib/trpc";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Админ эрх шаардлагатай" });
  }
  return next({ ctx });
});

export const heroMediaRouter = router({
  list: publicProcedure.query(async () => {
    return prisma.heroMedia.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }),

  adminList: adminProcedure.query(async () => {
    return prisma.heroMedia.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
  }),

  adminCreate: adminProcedure
    .input(
      z.object({
        type: z.enum(["video", "image"]),
        url: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const max = await prisma.heroMedia.aggregate({ _max: { order: true } });
      const nextOrder = (max._max.order ?? 0) + 1;
      const result = await prisma.heroMedia.create({
        data: { type: input.type, url: input.url, order: nextOrder },
      });
      revalidatePath("/");
      return result;
    }),

  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const result = await prisma.heroMedia.delete({ where: { id: input.id } });
      revalidatePath("/");
      return result;
    }),

  adminUpdate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        order: z.number().int().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await prisma.heroMedia.update({ where: { id }, data });
      revalidatePath("/");
      return result;
    }),

  adminReorder: adminProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      await prisma.$transaction(
        input.ids.map((id, idx) =>
          prisma.heroMedia.update({ where: { id }, data: { order: idx + 1 } })
        )
      );
      revalidatePath("/");
      return { ok: true };
    }),
});
