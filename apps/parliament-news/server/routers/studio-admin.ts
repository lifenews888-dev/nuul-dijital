import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { revalidatePath } from "next/cache";
import { router, editorialProcedure, ctxActor } from "@/lib/trpc";
import { canEditSettings, ROLE_LABELS } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { tenantData } from "@/lib/tenant-db";
import { SCHEMAS, SETTING_KEYS, putSetting, type SettingKey } from "@/lib/settings";
import { SEATS, SESSION_STATUSES, safeLink } from "@/lib/live-input";

/**
 * Удирдлагын мутацууд — тохиргоо, сэтгэгдэл, медиа сан, баг.
 *
 * Бүгд `canEditSettings` эсвэл супер админ шаардана. UI-д хэсгийг нуух нь
 * хамгаалалт биш: эдгээрийг `fetch`-ээр гараар дуудаж болно.
 */

const BANNER_BLOB = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function requireSettings(ctx: Parameters<typeof ctxActor>[0]) {
  const actor = ctxActor(ctx);
  if (!canEditSettings(actor)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Тохиргоо засах эрх алга" });
  }
  return actor;
}

function requireSuper(ctx: Parameters<typeof ctxActor>[0]) {
  const actor = ctxActor(ctx);
  if (actor.role !== "SUPER") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Зөвхөн супер админы эрх" });
  }
  return actor;
}

const rowId = z.string().min(1);

export const studioAdminRouter = router({
  /* ─────────────── Нэгдсэн хуралдаан, ШУУД, яаралтай ─────────────── */
  live: editorialProcedure
    .input(
      z.object({
        attendance: z.number().int().min(0).max(SEATS),
        sessionStatus: z.string().refine((v) => SESSION_STATUSES.includes(v), "Ийм төлөв алга"),
        tickerOn: z.boolean(),
        liveOn: z.boolean(),
        liveTitle: z.string().trim().max(80).optional(),
        liveUrl: z.string().trim().max(500).optional(),
        breakingOn: z.boolean(),
        breakingText: z.string().trim().max(140).optional(),
        breakingPostId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);

      /** Уншигчийн хөтөчид шинэ цонхоор нээгдэнэ — `javascript:` болохгүй */
      if (input.liveOn) {
        if (!safeLink(input.liveUrl)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Дамжуулалтын холбоос http эсвэл https байх ёстой",
          });
        }
      }
      if (input.breakingOn && !input.breakingText?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Яаралтай мэдээний текст хэрэгтэй" });
      }

      /** Яаралтай мэдээ НИЙТЛЭГДСЭН мэдээ рүү л заана — эс бөгөөс 404 */
      if (input.breakingPostId) {
        const hit = await ctx.db.newsPost.findFirst({
          where: { id: input.breakingPostId, status: "PUBLISHED" },
          select: { id: true },
        });
        if (!hit) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Зөвхөн нийтлэгдсэн мэдээ рүү заана",
          });
        }
      }

      const data = {
        attendance: input.attendance,
        sessionStatus: input.sessionStatus,
        tickerOn: input.tickerOn,
        liveOn: input.liveOn,
        liveTitle: input.liveTitle || null,
        liveUrl: input.liveOn ? (input.liveUrl ?? null) : null,
        breakingOn: input.breakingOn,
        breakingText: input.breakingText || null,
        breakingPostId: input.breakingPostId || null,
        updatedById: actor.userId,
      };

      const current = await ctx.db.liveState.findFirst({ select: { id: true } });
      if (current) await ctx.db.liveState.updateMany({ where: { id: current.id }, data });
      else await ctx.db.liveState.create({ data: tenantData(data) });

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "live",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Өнөөдөр хэлэлцэх асуудал ─────────────── */
  agenda: editorialProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        rows: z
          .array(
            z.object({
              time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Цаг нь HH:MM"),
              text: z.string().trim().min(1).max(200),
            }),
          )
          .max(12),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);
      const day = new Date(`${input.date}T00:00:00Z`);

      /** Нэг өдрийн мөрүүд цөөн — бүхэлд нь солих нь ялгаварлахаас хялбар */
      await ctx.db.agenda.deleteMany({ where: { date: day } });
      if (input.rows.length > 0) {
        await ctx.db.agenda.createMany({
          data: input.rows.map((r, order) =>
            tenantData({ date: day, time: r.time, text: r.text, order }),
          ),
        });
      }

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "agenda",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Гүйдэг мөрийн зар ─────────────── */
  ticker: editorialProcedure
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              text: z.string().trim().min(1).max(140),
              url: z.string().trim().max(500).optional(),
              active: z.boolean(),
            }),
          )
          .max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);

      for (const row of input.rows) {
        if (row.url && !safeLink(row.url)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Зарын холбоос буруу байна" });
        }
      }

      await ctx.db.tickerAd.deleteMany({});
      if (input.rows.length > 0) {
        await ctx.db.tickerAd.createMany({
          data: input.rows.map((r, order) =>
            tenantData({ text: r.text, url: r.url || null, active: r.active, order }),
          ),
        });
      }

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "ticker",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Валютын ханш ─────────────── */
  fx: editorialProcedure
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              code: z.string().regex(/^[A-Z]{3}$/, "Код нь гурван том үсэг"),
              value: z.number().positive().max(1_000_000),
              change: z.number().min(-100_000).max(100_000),
            }),
          )
          .max(6),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);
      await ctx.db.fxRate.deleteMany({});
      if (input.rows.length > 0) {
        await ctx.db.fxRate.createMany({
          data: input.rows.map((r, order) =>
            tenantData({ code: r.code, value: r.value, change: r.change, order }),
          ),
        });
      }
      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "fx",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Зарын үнийн санал ─────────────── */
  rates: editorialProcedure
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              place: z.string().trim().min(1).max(80),
              size: z.string().trim().max(40).optional(),
              unit: z.string().trim().min(1).max(30),
              price: z.number().int().min(0).max(1_000_000_000),
            }),
          )
          .max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);
      await ctx.db.adRate.deleteMany({});
      if (input.rows.length > 0) {
        await ctx.db.adRate.createMany({
          data: input.rows.map((r, order) =>
            tenantData({
              place: r.place,
              size: r.size || null,
              unit: r.unit,
              price: r.price,
              order,
            }),
          ),
        });
      }
      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "rates",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Сурталчилгааны баннер ─────────────── */
  /**
   * Медиа нь ЗӨВХӨН манай blob-оос. Гадны хаяг зөвшөөрвөл: (1) `next/image`
   * production-д 400 буцаана, (2) зар байршуулагч хожим файлаа сольж, бидний
   * нэрээр өөр зүйл харуулж чадна.
   */
  banners: editorialProcedure
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              imageUrl: z.string().trim().regex(BANNER_BLOB, "Зөвхөн сайтдаа байршуулсан файл"),
              kind: z.enum(["image", "video"]),
              linkUrl: z.string().trim().max(400).optional(),
              title: z.string().trim().max(80).optional(),
              placement: z.enum(["home", "article", "side", "both", "all"]),
              startsOn: z.string().regex(DAY_ONLY).optional(),
              endsOn: z.string().regex(DAY_ONLY).optional(),
              paid: z.boolean().default(true),
              amount: z.number().int().min(0).max(1_000_000_000).default(0),
            }),
          )
          .max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);

      for (const r of input.rows) {
        if (r.linkUrl && !safeLink(r.linkUrl)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Холбоос нь http эсвэл https байх ёстой" });
        }
        /** Эхлэхээс өмнө дуусах зар бол хэзээ ч гарахгүй — чимээгүй алдаа. */
        if (r.startsOn && r.endsOn && r.startsOn > r.endsOn) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Дуусах огноо нь эхлэхээс өмнө байна" });
        }
      }

      await ctx.db.banner.deleteMany({});
      if (input.rows.length > 0) {
        await ctx.db.banner.createMany({
          data: input.rows.map((r, order) =>
            tenantData({
              imageUrl: r.imageUrl,
              kind: r.kind,
              linkUrl: r.linkUrl || null,
              title: r.title || null,
              placement: r.placement,
              startsOn: r.startsOn ? new Date(r.startsOn) : null,
              endsOn: r.endsOn ? new Date(r.endsOn) : null,
              paid: r.paid,
              amount: r.amount,
              order,
            }),
          ),
        });
      }

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "banners",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Ангилал ─────────────── */
  categories: editorialProcedure
    .input(
      z.object({
        rows: z
          .array(
            z.object({
              id: z.string().optional(),
              slug: z
                .string()
                .trim()
                .regex(/^[a-z0-9-]+$/, "Хаяг нь латин үсэг, тоо, зураас"),
              name: z.string().trim().min(1).max(40),
              inMenu: z.boolean(),
            }),
          )
          .max(24),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);

      const slugs = input.rows.map((r) => r.slug);
      if (new Set(slugs).size !== slugs.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ангиллын хаяг давхардаж байна" });
      }

      const existing = await ctx.db.newsCategory.findMany({ select: { id: true } });
      const keep = new Set(input.rows.map((r) => r.id).filter(Boolean) as string[]);

      /**
       * Устгасан ангилалд хамаарах мэдээ нь `onDelete: SetNull`-ээр
       * ангилалгүй болно — мэдээ нь ҮЛДЭНЭ.
       */
      const doomed = existing.filter((c) => !keep.has(c.id)).map((c) => c.id);
      if (doomed.length > 0) {
        await ctx.db.newsCategory.deleteMany({ where: { id: { in: doomed } } });
      }

      for (const [order, row] of input.rows.entries()) {
        if (row.id) {
          await ctx.db.newsCategory.updateMany({
            where: { id: row.id },
            data: { slug: row.slug, name: row.name, inMenu: row.inMenu, order },
          });
        } else {
          await ctx.db.newsCategory.create({
            data: tenantData({ slug: row.slug, name: row.name, inMenu: row.inMenu, order }),
          });
        }
      }

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "categories",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Цаг агаар, толгой, хөл, RSS ─────────────── */
  site: editorialProcedure
    .input(z.object({ key: z.string(), value: z.unknown() }))
    .mutation(async ({ ctx, input }) => {
      const actor = requireSettings(ctx);

      if (!(SETTING_KEYS as readonly string[]).includes(input.key)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ийм тохиргоо байхгүй" });
      }
      const key = input.key as SettingKey;

      const parsed = SCHEMAS[key].safeParse(input.value);
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Тохиргооны утга буруу байна" });
      }

      await putSetting(ctx.db, key, parsed.data as never);
      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "settings",
        note: key,
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  /* ─────────────── Сэтгэгдэл ─────────────── */
  commentVisibility: editorialProcedure
    .input(z.object({ id: rowId, hidden: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const actor = ctxActor(ctx);
      if (!["SUPER", "CHIEF", "REVIEWER"].includes(actor.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Сэтгэгдэл удирдах эрх алга" });
      }

      const updated = await ctx.db.newsComment.updateMany({
        where: { id: input.id },
        data: { hidden: input.hidden },
      });
      if (updated.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Сэтгэгдэл олдсонгүй" });
      }

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: input.hidden ? "comment-hide" : "comment-show",
      });
      revalidatePath("/");
      return { ok: true as const };
    }),

  commentRemove: editorialProcedure.input(z.object({ id: rowId })).mutation(async ({ ctx, input }) => {
    const actor = ctxActor(ctx);
    if (!["SUPER", "CHIEF"].includes(actor.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Сэтгэгдэл устгах эрх алга" });
    }
    const removed = await ctx.db.newsComment.deleteMany({ where: { id: input.id } });
    if (removed.count === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Сэтгэгдэл олдсонгүй" });
    }
    await logActivity(ctx.db, {
      tenantId: ctx.tenantId,
      postId: null,
      userId: actor.userId,
      action: "comment-delete",
    });
    revalidatePath("/");
    return { ok: true as const };
  }),

  /* ─────────────── Баг ба эрх ─────────────── */
  memberRole: editorialProcedure
    .input(
      z.object({
        userId: rowId,
        role: z.enum(Object.keys(ROLE_LABELS) as [string, ...string[]]),
        active: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireSuper(ctx);

      /**
       * Супер админ өөрийгөө буулгах, хаахаас сэргийлнэ: сүүлчийн супер
       * админ эрхээ алдвал тохиргоонд хүрэх хүн үлдэхгүй.
       */
      if (input.userId === actor.userId && (input.role !== "SUPER" || !input.active)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Өөрийнхөө супер админ эрхийг хасаж болохгүй",
        });
      }

      const updated = await ctx.db.tenantMember.updateMany({
        where: { userId: input.userId },
        data: { role: input.role as never, active: input.active },
      });
      if (updated.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Гишүүн олдсонгүй" });
      }

      await logActivity(ctx.db, {
        tenantId: ctx.tenantId,
        postId: null,
        userId: actor.userId,
        action: "member-role",
        note: `${input.userId} → ${input.role}${input.active ? "" : " (хаасан)"}`,
      });
      return { ok: true as const };
    }),
});
