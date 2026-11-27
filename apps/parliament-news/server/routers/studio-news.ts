import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { router, editorialProcedure, ctxActor } from "@/lib/trpc";
import { canAct, canDelete, ACTION_STATUS } from "@/lib/permissions";
import { logActivity, NOTE_MAX } from "@/lib/activity";

/**
 * РЕДАКЦЫН УРСГАЛ — сервер талын хаалга.
 *
 * UI-д товч нуух нь ХАМГААЛАЛТ БИШ: procedure-ийг `fetch`-ээр гараар
 * дуудаж болно. Иймд үйлдэл бүр `lib/permissions.ts`-ийн шалгалтаар
 * дамжина, тэр нь `admin.html`-ийн матрицыг яг хэвээр барина.
 *
 * `ctx.db` нь `forTenant()` — `findUnique`, `update`, `delete` нь тэнд
 * ХОРИГЛОГДСОН (id-гаар өөр tenant-ийн мөрт хүрэх эрсдэлтэй тул). Иймд
 * `findFirst`, `updateMany`, `deleteMany` хэрэглэнэ: tenant-ийн хаалга
 * эрхийн шалгалтаас ДЭЭГҮҮР, өөрөөр хэлбэл супер админ ч хөршийн
 * ноорогт хүрэхгүй.
 */

const WORKFLOW_ACTIONS = ["submit", "approve", "return", "publish", "unpublish"] as const;

/**
 * Нийтийн кэшлэгдсэн гадаргуу БҮГД — нэг газраас.
 *
 * `/` ба `/news/<slug>` нь илэрхий. `/rss.xml`, `/sitemap.xml` нь мөн
 * статик, `revalidate = 300`-тай: шинэчлэхгүй бол устгасан мэдээний URL
 * нь sitemap-д таван минут хүртэл үлдэж 404 болно, тэр хооронд feed
 * уншигч шинэ мэдээг алдана.
 *
 * `/c/<slug>`, `/tag/<tag>`, `/search` нь `searchParams` уншдаг тул
 * хүсэлт тутам дахин зурагдана — кэш байхгүй, шинэчлэх шаардлагагүй.
 */
function revalidatePublic(slug: string): void {
  revalidatePath("/");
  revalidatePath(`/news/${slug}`);
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");
}

export const studioNewsRouter = router({
  act: editorialProcedure
    .input(
      z
        .object({
          id: z.string().min(1),
          action: z.enum(WORKFLOW_ACTIONS),
          note: z.string().max(NOTE_MAX).optional(),
        })
        /**
         * Буцаалтын тайлбар нь ЗААВАЛ, СЕРВЕРТ.
         *
         * `admin.html:1220` нь хоосон тайлбарыг татгалзана, формын
         * textarea нь `required`. Гэхдээ procedure-ийг гараар дуудаж
         * болно: тайлбаргүй буцаалт нь сэтгүүлчид юу засахаа хэлэхгүй
         * мэдээ үлдээх ба бүртгэлийн мөр ч хэлэхгүй.
         */
        .refine((d) => d.action !== "return" || Boolean(d.note?.trim()), {
          path: ["note"],
          message: "Буцаахад тайлбар шаардлагатай",
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = ctxActor(ctx);

      const post = await ctx.db.newsPost.findFirst({
        where: { id: input.id },
        select: { id: true, slug: true, status: true, authorId: true },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });
      }

      if (!canAct(actor, post, input.action)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Энэ үйлдлийн эрх алга" });
      }

      const status = ACTION_STATUS[input.action];

      /**
       * `publishedAt` нь нийтийн шүүлтийн хаалга (`publishedAt <= now`).
       * Буулгахад цэвэрлэхгүй бол төлөв нь DRAFT болсон мэдээ нийтийн
       * жагсаалтад үлдэж магадгүй.
       */
      const publishedAt =
        input.action === "publish" ? new Date() : input.action === "unpublish" ? null : undefined;

      /**
       * Хянагчийн тайлбар нь ЗӨВХӨН буцаалтын үеийн; дахин илгээхэд
       * арилна, эс бөгөөс сэтгүүлч засаад илгээсний дараа ч «Эх сурвалж
       * дутуу» гэсэн хуучин сануулга хуудсан дээр үлдэнэ.
       */
      const reviewNote =
        input.action === "return" ? (input.note?.trim() || null) : input.action === "submit" ? null : undefined;

      /**
       * `status`-ийг where-д тавих нь compare-and-set: хоёр хүсэлт зэрэг
       * ирэхэд эрхийн шалгалт нь АЛЬ ХЭДИЙН өөрчлөгдсөн төлөв дээр
       * хийгдсэн байж болно. Тэр үед доорх `count === 0` салаа руу унаж,
       * шалгалтаа дахин хийхийг шаардана.
       */
      const updated = await ctx.db.newsPost.updateMany({
        where: { id: post.id, status: post.status },
        data: {
          status,
          ...(publishedAt !== undefined ? { publishedAt } : {}),
          ...(reviewNote !== undefined ? { reviewNote } : {}),
        },
      });

      /** Хоёр хүсэлт зэрэг ирвэл аль нэг нь мөрийг олохгүй байж болно */
      if (updated.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });
      }

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: post.id,
        userId: actor.userId,
        action: input.action,
        note: input.note,
      });

      /**
       * Review Focus #5: нийтийн хуудас `revalidate = 300`-тай. Кэшийг
       * хүчингүй болгохгүй бол редактор «Нийтэллээ» гэж харсан ч сайт
       * дээр 5 минут хүртэл гарахгүй — тэр нь ажиллахгүй байгаа шиг
       * харагдана.
       */
      revalidatePublic(post.slug);

      return { status };
    }),

  remove: editorialProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const actor = ctxActor(ctx);

      const post = await ctx.db.newsPost.findFirst({
        where: { id: input.id },
        select: { id: true, slug: true, status: true, authorId: true },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });
      }

      if (!canDelete(actor, post)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Устгах эрх алга" });
      }

      /**
       * Бүртгэлийг УСТГАХААС ӨМНӨ бичнэ, `postId: null`-тай: мөр нь
       * хэнийх ч биш болсон ч «хэн, хэзээ устгасан» гэдэг нь үлдэнэ.
       * Тайлбарт slug-ийг хийнэ — эс бөгөөс бүртгэлээс юу устсаныг
       * таних арга байхгүй.
       */
      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "delete",
        note: post.slug,
      });

      await ctx.db.newsPost.deleteMany({ where: { id: post.id } });

      revalidatePublic(post.slug);

      return { ok: true as const };
    }),
});
