import { router, publicProcedure } from "@/lib/trpc";
import { studioNewsRouter } from "./studio-news";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  studioNews: studioNewsRouter,
});

export type AppRouter = typeof appRouter;
