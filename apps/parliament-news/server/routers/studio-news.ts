import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { router, editorialProcedure, ctxActor } from "@/lib/trpc";
import { canAct, canDelete, canCreate, ACTION_STATUS } from "@/lib/permissions";
import { logActivity, NOTE_MAX } from "@/lib/activity";
import { postInputSchema, pickEditable, storyUntilFrom } from "@/lib/studio-post-input";
import { nextSlug } from "@/lib/slug";
import { parseLook } from "@/lib/cover";
import { sectionsFor, type Section } from "@/lib/permissions";
import { tenantData } from "@/lib/tenant-db";

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

/**
 * Медиагийн URL нь МАНАЙ blob-ийнх мөн үү.
 *
 * Энэ мутаци файл хүлээж авдаггүй — холбоос л бичнэ. Дурын хаяг
 * зөвшөөрвөл редакцын эрхтэй хэн ч манай нийтлэл дотор гадны сервер
 * рүү заасан зураг тавьж чадна: тэр сервер нь уншигчийн IP-г цуглуулах,
 * эсвэл хожим зургийг нь сольж өөр зүйл харуулах боломжтой болно.
 */
const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

function assertBlobUrl(url: string): void {
  if (!BLOB_HOST.test(url)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Зөвхөн сайтдаа байршуулсан файлыг холбоно",
    });
  }
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

      /*
       * «Нэг удаа нийтлэгдсэн эсэх»-ийг БҮРТГЭЛЭЭР шалгана.
       *
       * `nextSlug` нь `publishedAt !== null` гэж үздэг ч `unpublish` нь
       * тэр талбарыг цэвэрлэдэг: буулгаад гарчиг засвал хаяг чөлөөлөгдөж,
       * сошиалд тарсан холбоос 404 болно. Бүртгэлд `publish` үйлдэл
       * байгаа эсэх нь хөдөлдөггүй баримт.
       */
      const everPublished =
        existing !== null &&
        (existing.publishedAt !== null ||
          existing.status === "PUBLISHED" ||
          (await ctx.db.newsActivity.count({
            where: { postId: existing.id, action: "publish" },
          })) > 0);

      slug = nextSlug({
        title,
        currentSlug: existing?.slug ?? null,
        publishedAt: everPublished ? new Date(0) : null,
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
      /** Хоосон мөр нь «хас» гэсэн утгатай — `null` болж бичигдэнэ. */
      ...(data.storyUrl !== undefined ? { storyUrl: data.storyUrl || null } : {}),
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
        /** `tenantId`-г forTenant тавина; төрөл нь түүнийг мэдэхгүй */
        data: tenantData({
          slug,
          title,
          date: new Date(`${input.date}T00:00:00Z`),
          authorId: actor.userId,
          ...writable,
          /** Шинэ мэдээ ҮРГЭЛЖ ноорог — гараар тавьсан төлөвийг ч дарна */
          status: "DRAFT" as const,
        }),
        select: { id: true },
      });
      id = created.id;
    }

    /**
     * Хуулийн төсөл нь ТУСДАА хүснэгт (`Bill` + `BillStage`).
     *
     * Унтраахад УСТГАНА: үлдээвэл нийтлэлийн хуудас хуучин шатыг
     * харуулсаар байх ба редактор «болиулсан» гэж бодно. Шатуудыг
     * бүхэлд нь сольдог — таван мөр тул ялгаварлан шинэчлэх нь
     * нарийн төвөгтэй, ашиг нь алга.
     */
    if (data.billEnabled !== undefined) {
      const current = await ctx.db.bill.findFirst({
        where: { postId: id },
        select: { id: true },
      });

      if (!data.billEnabled) {
        if (current) {
          await ctx.db.billStage.deleteMany({ where: { billId: current.id } });
          await ctx.db.bill.deleteMany({ where: { id: current.id } });
        }
      } else {
        const billData = {
          title: title || existing?.title || "",
          stage: data.billStage ?? 0,
          votesYes: data.votesYes ?? 0,
          votesNo: data.votesNo ?? 0,
        };

        const billId = current
          ? (await ctx.db.bill.updateMany({ where: { id: current.id }, data: billData }),
            current.id)
          : (
              await ctx.db.bill.create({
                data: tenantData({ ...billData, postId: id }),
                select: { id: true },
              })
            ).id;

        if (data.billSteps !== undefined) {
          /*
           * Устгаад үүсгэх нь АТОМ байх ёстой: `createMany` унавал
           * таван шатны тайлбар аль хэдийн алга болсон байна.
           */
          await ctx.db.$transaction([
            ctx.db.billStage.deleteMany({ where: { billId } }),
            ctx.db.billStage.createMany({
              data: data.billSteps.map((step, index) => ({
                tenantId: ctx.tenantId,
                billId,
                index,
                note: step.note || null,
              })),
            }),
          ]);
        }
      }
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

    /**
     * ШИНЭ `updatedAt`-ийг буцаана — форм түүгээр өөрийн тэмдгээ
     * шинэчилнэ. Үгүй бол нэг хуудас ачаалалтад зөвхөн нэг удаа
     * хадгалж болно: хоёр дахь нь хуучин тэмдгээ илгээж, хуурамч
     * зөрчил авна.
     */
    const saved = await ctx.db.newsPost.findFirst({
      where: { id },
      select: { updatedAt: true, slug: true },
    });

    return {
      id,
      slug: saved?.slug ?? slug,
      updatedAt: (saved?.updatedAt ?? new Date()).toISOString(),
      dropped,
    };
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

  /**
   * Байршуулсан файлыг мэдээнд холбоно.
   *
   * Файл нь хөтчөөс blob руу ШУУД явсан байна; энд зөвхөн холбоосыг
   * бичнэ. Хоёр хаалга: `photos`/`video` хэсгийн эрх, ба хаяг нь манай
   * blob-ийнх эсэх.
   */
  attachMedia: editorialProcedure
    .input(
      z.object({
        postId: z.string().min(1),
        url: z.string().url(),
        kind: z.enum(["image", "video"]),
        caption: z.string().trim().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = ctxActor(ctx);
      assertBlobUrl(input.url);

      const post = await ctx.db.newsPost.findFirst({
        where: { id: input.postId },
        select: { id: true, slug: true, status: true, authorId: true },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });

      const need: Section = input.kind === "image" ? "photos" : "video";
      if (!sectionsFor(actor, post).includes(need)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Энэ хэсгийг засах эрх алга" });
      }

      /** Шинэ файл төгсгөлд — эхнийх нь хавтас хэвээр үлдэнэ */
      const last = await ctx.db.newsMedia.findFirst({
        where: { postId: post.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const row = await ctx.db.newsMedia.create({
        data: tenantData({
          postId: post.id,
          url: input.url,
          kind: input.kind,
          caption: input.caption || null,
          order: last ? last.order + 1 : 0,
        }),
        select: { id: true },
      });

      if (post.status === "PUBLISHED") revalidatePublic(post.slug);

      return { id: row.id };
    }),

  /** Зургийн тайлбар — admin.html-ийн «Зургийн тайлбар · зурагчны нэр» */
  captionMedia: editorialProcedure
    .input(z.object({ id: z.string().min(1), caption: z.string().trim().max(200) }))
    .mutation(async ({ ctx, input }) => {
      const actor = ctxActor(ctx);

      const media = await ctx.db.newsMedia.findFirst({
        where: { id: input.id },
        select: { id: true, kind: true, postId: true },
      });
      if (!media) throw new TRPCError({ code: "NOT_FOUND", message: "Файл олдсонгүй" });

      const post = await ctx.db.newsPost.findFirst({
        where: { id: media.postId },
        select: { id: true, slug: true, status: true, authorId: true },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });

      const need: Section = media.kind === "video" ? "video" : "photos";
      if (!sectionsFor(actor, post).includes(need)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Энэ хэсгийг засах эрх алга" });
      }

      await ctx.db.newsMedia.updateMany({
        where: { id: media.id },
        data: { caption: input.caption || null },
      });

      if (post.status === "PUBLISHED") revalidatePublic(post.slug);

      return { ok: true as const };
    }),

  removeMedia: editorialProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const actor = ctxActor(ctx);

      const media = await ctx.db.newsMedia.findFirst({
        where: { id: input.id },
        select: { id: true, kind: true, postId: true },
      });
      if (!media) throw new TRPCError({ code: "NOT_FOUND", message: "Файл олдсонгүй" });

      const post = await ctx.db.newsPost.findFirst({
        where: { id: media.postId },
        select: { id: true, slug: true, status: true, authorId: true },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });

      const need: Section = media.kind === "video" ? "video" : "photos";
      if (!sectionsFor(actor, post).includes(need)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Энэ хэсгийг засах эрх алга" });
      }

      await ctx.db.newsMedia.deleteMany({ where: { id: media.id } });

      if (post.status === "PUBLISHED") revalidatePublic(post.slug);

      return { ok: true as const };
    }),

  /** Дараалал — ЭХНИЙХ нь хавтас болно, тиймээс энэ нь дизайны шийдвэр */
  reorderMedia: editorialProcedure
    .input(z.object({ postId: z.string().min(1), ids: z.array(z.string().min(1)).max(40) }))
    .mutation(async ({ ctx, input }) => {
      const actor = ctxActor(ctx);

      const post = await ctx.db.newsPost.findFirst({
        where: { id: input.postId },
        select: { id: true, slug: true, status: true, authorId: true },
      });
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Мэдээ олдсонгүй" });

      if (!sectionsFor(actor, post).includes("photos")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Энэ хэсгийг засах эрх алга" });
      }

      /** `updateMany` нь postId-гаар хязгаарлагдана — өөр мэдээний файл хөдлөхгүй */
      for (const [order, id] of input.ids.entries()) {
        await ctx.db.newsMedia.updateMany({ where: { id, postId: post.id }, data: { order } });
      }

      if (post.status === "PUBLISHED") revalidatePublic(post.slug);

      return { ok: true as const };
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
