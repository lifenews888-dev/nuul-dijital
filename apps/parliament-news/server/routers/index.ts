import { router, publicProcedure } from "@/lib/trpc";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
});

export type AppRouter = typeof appRouter;
