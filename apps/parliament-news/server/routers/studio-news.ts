import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { router, editorialProcedure, ctxActor } from "@/lib/trpc";
import { canAct, canDelete, canCreate, ACTION_STATUS } from "@/lib/permissions";
import { logActivity, NOTE_MAX } from "@/lib/activity";
import { postInputSchema, pickEditable, storyUntilFrom } from "@/lib/studio-post-input";
import { nextSlug } from "@/lib/slug";
import { parseLook } from "@/lib/cover";

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
  /**
   * Мэдээ үүсгэх, засах — засварлагчийн ЦОРЫН ГАНЦ бичих хаалга.
   *
   * Дараалал нь санамсаргүй биш:
   *   1. хэн бэ (`ctxActor`)
   *   2. юу засах гэж байна (`findFirst` — tenant-ийн хаалга)
   *   3. хэнийх, ямар төлөвтэй (`pickEditable` → `sectionsFor`)
   *   4. хоцорсон хуулбар эсэх (`expectedUpdatedAt`)
   *   5. дараа нь л бичнэ
   *
   * Гурав дахь алхам бол гол нь: эрхгүй хэсгийн талбар ЭНД унана, формд
   * биш. Формыг тойрч `fetch`-ээр дуудсан ч ялгаагүй.
   */
  save: editorialProcedure.input(postInputSchema).mutation(async ({ ctx, input }) => {
    const actor = ctxActor(ctx);
    const now = new Date();

    const existing = input.id
      ? await ctx.db.newsPost.findFirst({
          where: { id: input.id },
          select: {
            id: true,
            slug: true,
            status: true,
            authorId: true,
            publishedAt: true,
            updatedAt: true,
            title: true,
          },
        })
      : null;

    if (input.id && !existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });
    }

    if (!existing && !canCreate(actor)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Мэдээ үүсгэх эрх алга" });
    }

    const ref = existing
      ? { id: existing.id, status: existing.status, authorId: existing.authorId }
      : { id: null, status: "DRAFT" as const, authorId: actor.userId };

    const { data, dropped } = pickEditable(actor, ref, input);

    if (Object.keys(data).length === 0) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Энэ мэдээг засах эрх алга" });
    }

    /**
     * Review Focus #3 — хоёр редактор зэрэг засах.
     *
     * Хоцорсон хуулбараас ирсэн хадгалалт нь нөгөөгийн 10 минутын ажлыг
     * чимээгүй дарж бичнэ. Сервер нь аль нь зөв болохыг мэдэхгүй тул
     * шийдэхгүй — ХЭЛНЭ.
     */
    if (input.expectedUpdatedAt && existing) {
      const seen = new Date(input.expectedUpdatedAt).getTime();
      if (seen !== existing.updatedAt.getTime()) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Энэ мэдээг өөр хүн засаж өөрчлөгдсөн байна. Хуудсыг шинэчилж, дахин оролдоно уу.",
        });
      }
    }

    /** Ангилал нь НЭРЭЭР ирнэ — танихгүй нэрэнд хоосон үлдэнэ, унахгүй */
    let categoryId: string | null | undefined;
    if (data.categoryName !== undefined) {
      const name = data.categoryName?.trim();
      const cat = name
        ? await ctx.db.newsCategory.findFirst({ where: { name }, select: { id: true } })
        : null;
      categoryId = cat?.id ?? null;
    }

    /**
     * Review Focus #2 — `nextSlug` нь НИЙТЛЭГДСЭН мэдээний хаягийг
     * хөдөлгөхгүй. Сошиалд тарсан, Google-д индекслэгдсэн холбоос
     * гарчиг засах болгонд үхэх ёсгүй.
     */
    const title = data.title ?? existing?.title ?? "";
    let slug = existing?.slug ?? "";
    if (data.title !== undefined) {
      const taken = (
        await ctx.db.newsPost.findMany({
          where: existing ? { NOT: { id: existing.id } } : {},
          select: { slug: true },
        })
      ).map((p) => p.slug);

      slug = nextSlug({
        title,
        currentSlug: existing?.slug ?? null,
        publishedAt: existing?.publishedAt ?? null,
        status: existing?.status,
        taken,
      });
    }

    const look = data.look !== undefined ? parseLook(data.look) : undefined;
    const storyUntil =
      data.story !== undefined || data.storyDays !== undefined
        ? storyUntilFrom(data.story, data.storyDays, now)
        : undefined;

    /** `undefined` нь «бүү хөндө», `null` нь «цэвэрлэ» */
    const writable = {
      ...(data.title !== undefined ? { title, slug } : {}),
      ...(data.date !== undefined ? { date: new Date(`${data.date}T00:00:00Z`) } : {}),
      ...(data.kicker !== undefined ? { kicker: data.kicker || null } : {}),
      ...(data.lead !== undefined ? { lead: data.lead || null } : {}),
      ...(data.body !== undefined ? { body: data.body || null } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(data.subcategory !== undefined ? { subcategory: data.subcategory || null } : {}),
      ...(data.reporter !== undefined ? { reporter: data.reporter || null } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.sources !== undefined ? { sources: data.sources } : {}),
      ...(data.motif !== undefined ? { motif: data.motif } : {}),
      ...(data.theme !== undefined ? { theme: data.theme } : {}),
      ...(look !== undefined ? { look: look ?? undefined } : {}),
      ...(data.channels !== undefined ? { channels: data.channels } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.story !== undefined ? { story: data.story } : {}),
      ...(storyUntil !== undefined ? { storyUntil } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    };

    let id: string;

    if (existing) {
      /**
       * Хоосон `data`-тай `updateMany` нь `count: 0` буцаана — тэр нь
       * «мөр олдсонгүй» ГЭСЭН УГ БИШ. Зөвхөн хажуугийн хүснэгтэд
       * (хуулийн төсөл, медиа) бичдэг хадгалалт яг ийм байна.
       */
      if (Object.keys(writable).length > 0) {
        const updated = await ctx.db.newsPost.updateMany({
          where: { id: existing.id },
          data: writable,
        });
        if (updated.count === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });
        }
      }
      id = existing.id;
    } else {
      const created = await ctx.db.newsPost.create({
        data: {
          slug,
          title,
          date: new Date(`${input.date}T00:00:00Z`),
          status: "DRAFT",
          authorId: actor.userId,
          ...writable,
        },
        select: { id: true },
      });
      id = created.id;
    }

    await logActivity(ctx.db, {
      tenantId: ctx.tenantId,
      postId: id,
      userId: actor.userId,
      action: existing ? "save" : "create",
    });

    /**
     * Зөвхөн НИЙТЭД харагддаг мэдээг засахад кэш хөндөнө. Ноорог засах
     * болгонд нүүрийг дахин зурах нь утгагүй ажил.
     */
    const wasPublic = existing?.status === "PUBLISHED";
    if (wasPublic || data.status === "PUBLISHED") {
      revalidatePublic(slug || existing?.slug || "");
    }

    return { id, slug, dropped };
  }),

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
