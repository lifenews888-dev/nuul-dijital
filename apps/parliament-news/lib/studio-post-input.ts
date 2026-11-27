import { z } from "zod";
import type { NewsStatus } from "@nuul/db-news";
import { sectionsFor, canSetStatusManually, type Actor, type PostRef, type Section } from "./permissions";

/**
 * Засварлагчийн ОРОЛТ — схем ба эрхийн шүүлт.
 *
 * Хоёр тусдаа хамгаалалт:
 *   1. `postInputSchema` — утга нь БОЛОМЖИТ эсэх (урт, төрөл, хил)
 *   2. `pickEditable`  — энэ хүн тэр талбарыг бичиж БОЛОХ эсэх
 *
 * Хоёр дахь нь илүү чухал: формд талбар нуух нь хамгаалалт биш, мутацийг
 * `fetch`-ээр гараар дуудаж болно. `MEDIA` үүрэг зураг солихоор ирээд
 * гарчгийг хамт илгээвэл гарчиг ХАДГАЛАГДАХ ЁСГҮЙ.
 */

/** admin.html-ийн хязгаарууд (:577-672) */
export const LIMITS = {
  title: 160,
  kicker: 40,
  category: 40,
  subcategory: 40,
  reporter: 60,
  lead: 300,
  body: 8000,
  sources: 20,
  tags: 20,
  tag: 60,
} as const;

/** admin.html-ийн `f_sdur` сонголтууд: 24 цаг, 3 өдөр, 7 хоног, хугацаагүй */
const STORY_DAYS = [0, 1, 3, 7] as const;

/** `YYYY-MM-DD` ба жинхэнэ огноо эсэх */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Огноо нь YYYY-MM-DD хэлбэртэй байна")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Ийм огноо байхгүй");

/**
 * Эх сурвалж нь нийтлэлийн доор дарагдах товч болно. `javascript:` эсвэл
 * `data:` холбоос тэнд очвол уншигчийн хөтөч дээр код ажиллана.
 */
const sourceUrl = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((v) => /^https?:\/\/.+/i.test(v), "Эх сурвалж нь http эсвэл https байх ёстой");

const trimmedMax = (max: number) => z.string().trim().max(max);

export const postInputSchema = z.object({
  id: z.string().min(1).optional(),

  // basic
  title: z.string().trim().min(1, "Гарчиг оруулна уу").max(LIMITS.title),
  date: dateString,
  kicker: trimmedMax(LIMITS.kicker).nullable().optional(),
  lead: trimmedMax(LIMITS.lead).nullable().optional(),
  body: trimmedMax(LIMITS.body).nullable().optional(),
  categoryName: trimmedMax(LIMITS.category).nullable().optional(),
  subcategory: trimmedMax(LIMITS.subcategory).nullable().optional(),
  reporter: trimmedMax(LIMITS.reporter).nullable().optional(),
  tags: z.array(trimmedMax(LIMITS.tag).min(1)).max(LIMITS.tags).optional(),

  // src
  sources: z.array(sourceUrl).max(LIMITS.sources).optional(),

  // look
  motif: z.string().trim().max(20).optional(),
  theme: z.number().int().min(0).max(2).optional(),
  /** `parseLook` нь санд бичихээс өмнө цэвэрлэнэ — энд зөвхөн объект эсэх */
  look: z.unknown().optional(),

  // bill
  billEnabled: z.boolean().optional(),
  billStage: z.number().int().min(0).max(4).optional(),
  votesYes: z.number().int().min(0).max(1000).optional(),
  votesNo: z.number().int().min(0).max(1000).optional(),
  /** `BillStage.note` нь `@db.VarChar(1500)`, artifact нь `maxlength=1500` */
  billSteps: z.array(z.object({ note: trimmedMax(1500) })).max(5).optional(),

  // pub
  // ТАЙЛБАР: artifact-ийн «Сошиал постын текст» (`f_soc`, 2200) нь ЭНД
  // БАЙХГҮЙ — `NewsPost`-д тохирох багана алга. Дэлгэрэнгүйг README.
  channels: z.array(trimmedMax(40).min(1)).max(10).optional(),
  featured: z.boolean().optional(),
  story: z.boolean().optional(),
  storyDays: z
    .number()
    .int()
    .refine((v) => (STORY_DAYS as readonly number[]).includes(v), "Ийм хугацаа байхгүй")
    .optional(),

  /** Зөвхөн супер админ — `pickEditable` хаана */
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "RETURNED"]).optional(),

  /**
   * Уншсан үеийн `updatedAt`. Өгөгдсөн бол сервер түүнийг одоогийнхтой
   * харьцуулж, зөрвөл татгалзана — хоёр редактор зэрэг засахад нэг нь
   * нөгөөгийнхөө ажлыг чимээгүй дарж бичихээс сэргийлнэ.
   */
  expectedUpdatedAt: z.string().optional(),
});

export type PostInput = z.infer<typeof postInputSchema>;

/**
 * Талбар бүр ЯМАР хэсэгт харьяалагдах вэ — admin.html-ийн `data-sec`.
 *
 * `id`, `expectedUpdatedAt` нь утга биш, `status` нь өөрийн хаалгатай,
 * `date` нь `basic`-д (огноо нь үндсэн мэдээлэлд бичигдэнэ).
 */
export const FIELD_SECTION: Record<string, Section> = {
  title: "basic",
  date: "basic",
  kicker: "basic",
  lead: "basic",
  body: "basic",
  categoryName: "basic",
  subcategory: "basic",
  reporter: "basic",
  tags: "basic",

  sources: "src",

  motif: "look",
  theme: "look",
  look: "look",

  billEnabled: "bill",
  billStage: "bill",
  votesYes: "bill",
  votesNo: "bill",
  billSteps: "bill",

  channels: "pub",
  featured: "pub",
  story: "pub",
  storyDays: "pub",
};

const META_FIELDS = new Set(["id", "expectedUpdatedAt"]);

/**
 * Энэ хүн энэ мэдээнд бичиж БОЛОХ талбаруудыг л үлдээнэ.
 *
 * `dropped` нь чимээгүй алдагдахаас сэргийлнэ: дуудагч хэрэглэгчид
 * «эдгээр талбарт эрх алга» гэж хэлж чадна. Чимээгүй хаях нь редактор
 * ажлаа хадгалсан гэж бодоод алдахад хүргэнэ.
 */
export function pickEditable(
  actor: Actor,
  post: PostRef,
  input: PostInput,
): { data: Partial<PostInput>; dropped: string[] } {
  const allowed = new Set<Section>(sectionsFor(actor, post));
  const data: Record<string, unknown> = {};
  const dropped: string[] = [];

  for (const [field, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (META_FIELDS.has(field)) continue;

    if (field === "status") {
      if (canSetStatusManually(actor)) data.status = value;
      else dropped.push(field);
      continue;
    }

    const section = FIELD_SECTION[field];
    /** Хүснэгтэд байхгүй талбарыг ХАЯНА — шинэ талбар нэмэхэд эрхгүй орж ирэхгүй */
    if (!section || !allowed.has(section)) {
      dropped.push(field);
      continue;
    }

    data[field] = value;
  }

  return { data: data as Partial<PostInput>, dropped };
}

/** Сторины дуусах хугацаа — `storyDays: 0` нь хугацаагүй */
export function storyUntilFrom(
  story: boolean | undefined,
  days: number | undefined,
  now: Date,
): Date | null {
  if (!story || !days) return null;
  return new Date(now.getTime() + days * 86_400_000);
}

export type { NewsStatus };
