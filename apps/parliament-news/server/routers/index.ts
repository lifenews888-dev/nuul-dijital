import { router, publicProcedure } from "@/lib/trpc";
import { studioNewsRouter } from "./studio-news";
import { studioAdminRouter } from "./studio-admin";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  studioNews: studioNewsRouter,
  studioAdmin: studioAdminRouter,
});

export type AppRouter = typeof appRouter;
