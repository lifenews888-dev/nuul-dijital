/**
 * Редакцын эрх — БҮХ шийдвэр энд, цэвэр функцээр.
 *
 * Эх сурвалж: `site-v2/admin.html:841-886` (ROLES, SECS, secsFor, canDel, canNew)
 * ба `:981-990` (applyLocks-ийн үйлдлийн хаалгууд).
 *
 * UI-д товч нуух нь ХАМГААЛАЛТ БИШ. tRPC-ийн мутаци бүр эдгээрийг дуудна —
 * `editorialProcedure` нь «редакцын гишүүн эсэх»-ийг хэлэх ба хэн юуг хийж
 * чадахыг зөвхөн энэ файл шийднэ.
 */

import type { NewsRole, NewsStatus } from "@nuul/db-news";

/** Мэдээ бэлтгэх хуудсын хэсгүүд — admin.html-ийн `data-sec` */
export type Section = "basic" | "photos" | "video" | "bill" | "src" | "look" | "pub";

/** Урсгалын үйлдлүүд — admin.html-ийн `NS`-ийн түлхүүрүүд */
export type WorkflowAction = "submit" | "approve" | "return" | "publish" | "unpublish";

/**
 * Эрхийн шийдвэрт хэрэгтэй мэдээний хэсэг. `id === null` нь хадгалаагүй шинэ
 * мэдээ — artifact-ийн `own(n) = !n.id || n.createdBy == uid`.
 */
export type PostRef = { id: string | null; status: NewsStatus; authorId: string | null };

/** Үйлдэл хийж байгаа хүн. Редакцын гишүүн биш бол Actor ҮҮСЭХГҮЙ. */
export type Actor = { userId: string; role: NewsRole };

export const ROLE_LABELS: Record<NewsRole, { name: string; about: string }> = {
  SUPER: {
    name: "Супер админ",
    about: "Бүх эрх: хэрэглэгчид эрх олгох, бүх мэдээ, тохиргоо, төлөвийг гараар солих",
  },
  CHIEF: {
    name: "Ерөнхий редактор",
    about: "Бүх мэдээг засах, батлах, буцаах, нийтлэх, нийтлэлээс буулгах, устгах",
  },
  REVIEWER: {
    name: "Хянагч",
    about: "Хянагдаж буй мэдээг засах, батлах эсвэл тайлбартай буцаах. Нийтлэхгүй",
  },
  REPORTER: {
    name: "Сэтгүүлч",
    about:
      "Мэдээ бичих, зураг видео оруулах, хянуулахаар илгээх. Зөвхөн өөрийн ноорог, буцаасан мэдээг засна",
  },
  MEDIA: {
    name: "Зураг, видео редактор",
    about: "Нийтлэгдээгүй мэдээний зураг, видео, тайлбарыг засна. Текстэд хүрэхгүй",
  },
  LEGAL: {
    name: "Хуулийн мэдээний хариуцагч",
    about: "Хуулийн төслийн шат, санал хураалт, шат бүрийн тайлбарыг засна",
  },
  SOCIAL: {
    name: "Сошиал менежер",
    about: "Нийтлэх сувгууд болон сошиал постын текстийг засна",
  },
  LIVE: {
    name: "Шууд дамжуулалтын оператор",
    about: "Ирц, хуралдааны төлөв, өнөөдрийн хөтөлбөр, «ШУУД» мөрийг удирдана",
  },
  CONTRIBUTOR: {
    name: "Зочин зохиогч",
    about: "Зөвхөн өөрийн ноорог бичиж хянуулахаар илгээнэ. Зураг, видео оруулахгүй",
  },
  ANALYST: {
    name: "Шинжээч",
    about: "Самбар, жагсаалтыг зөвхөн харна",
  },
};

const EVERY_SECTION: Section[] = ["basic", "photos", "video", "bill", "src", "look", "pub"];

/** admin.html-ийн `SECS` — үүрэг бүрийн ДЭЭД хязгаар, төлөвөөс үл хамаарсан */
export const SECTIONS: Record<NewsRole, Section[]> = {
  SUPER: EVERY_SECTION,
  CHIEF: EVERY_SECTION,
  REVIEWER: EVERY_SECTION,
  REPORTER: ["basic", "photos", "video", "bill", "src", "look"],
  CONTRIBUTOR: ["basic", "src", "look"],
  MEDIA: ["photos", "video"],
  LEGAL: ["bill", "src"],
  SOCIAL: ["pub"],
  LIVE: [],
  ANALYST: [],
};

/** admin.html-ийн `NS` — үйлдэл хийсний дараах төлөв */
export const ACTION_STATUS: Record<WorkflowAction, NewsStatus> = {
  submit: "REVIEW",
  approve: "APPROVED",
  return: "RETURNED",
  publish: "PUBLISHED",
  unpublish: "DRAFT",
};

/**
 * admin.html-ийн `FLOW` — харагдах урсгалын шатууд. «Буцаасан» нь шат биш,
 * хажуугийн сум тул энд БАЙХГҮЙ.
 */
export const FLOW: { status: NewsStatus; label: string }[] = [
  { status: "DRAFT", label: "Ноорог" },
  { status: "REVIEW", label: "Хянагдаж буй" },
  { status: "APPROVED", label: "Батлагдсан" },
  { status: "PUBLISHED", label: "Нийтлэгдсэн" },
];

const EVERY_STATUS: NewsStatus[] = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "RETURNED"];
const UNPUBLISHED: NewsStatus[] = ["DRAFT", "REVIEW", "APPROVED", "RETURNED"];

/** Жагсаалтад ямар төлөвүүд харагдах вэ */
const VISIBLE: Record<NewsRole, NewsStatus[]> = {
  SUPER: EVERY_STATUS,
  CHIEF: EVERY_STATUS,
  REVIEWER: EVERY_STATUS,
  REPORTER: EVERY_STATUS,
  CONTRIBUTOR: EVERY_STATUS,
  MEDIA: UNPUBLISHED,
  LEGAL: UNPUBLISHED,
  SOCIAL: ["APPROVED", "PUBLISHED"],
  LIVE: ["PUBLISHED"],
  ANALYST: ["PUBLISHED"],
};

/** admin.html-ийн `canNew` */
const CAN_CREATE: NewsRole[] = ["SUPER", "CHIEF", "REVIEWER", "REPORTER", "CONTRIBUTOR"];

/** admin.html-ийн `navSet` */
const CAN_SETTINGS: NewsRole[] = ["SUPER", "CHIEF", "LIVE"];

/** Сэтгүүлч, зочин зохиогч өөрийн мэдээг зөвхөн эдгээр төлөвт засна */
const OWN_EDIT: NewsStatus[] = ["DRAFT", "RETURNED"];

const CHIEFS: NewsRole[] = ["SUPER", "CHIEF"];

/** admin.html: `own = n => !n.id || n.createdBy == uid` */
function own(actor: Actor, post: PostRef): boolean {
  return post.id === null || post.authorId === actor.userId;
}

/**
 * Эрх + төлөв + эзэмшлээр ЗАСАХ хэсгүүд — admin.html-ийн `secsFor`.
 *
 * `SECTIONS[role]` дангаараа хүрэхгүй: тэр нь зөвхөн дээд хязгаар. Сэтгүүлч
 * өөрийн ноорогоо засна, гэхдээ хянуулахаар илгээсэн хойноо биш, бусдынхыг
 * хэзээ ч биш.
 */
export function sectionsFor(actor: Actor, post: PostRef): Section[] {
  const base = [...SECTIONS[actor.role]];

  if (actor.role === "REPORTER" || actor.role === "CONTRIBUTOR") {
    return own(actor, post) && OWN_EDIT.includes(post.status) ? base : [];
  }

  if (actor.role === "REVIEWER") {
    return post.id === null || post.status === "REVIEW" || post.status === "APPROVED" ? base : [];
  }

  if (actor.role === "MEDIA") {
    return post.status === "PUBLISHED" ? [] : base;
  }

  return base;
}

/** Нэг хэсгийг засах эрхтэй эсэх */
export function canEditSection(actor: Actor, post: PostRef, section: Section): boolean {
  return sectionsFor(actor, post).includes(section);
}

/** admin.html-ийн `canNew` */
export function canCreate(actor: Actor): boolean {
  return CAN_CREATE.includes(actor.role);
}

/**
 * admin.html-ийн `canDel`:
 * `is('super','chief') || (is('reporter','contributor') && own(n) && n.id && [draft,returned])`
 *
 * `n.id` нь ЧУХАЛ: хадгалаагүй мэдээг устгах гэдэг зүйл байхгүй.
 */
export function canDelete(actor: Actor, post: PostRef): boolean {
  if (CHIEFS.includes(actor.role)) return true;

  if (actor.role === "REPORTER" || actor.role === "CONTRIBUTOR") {
    return post.id !== null && post.authorId === actor.userId && OWN_EDIT.includes(post.status);
  }

  return false;
}

/**
 * Урсгалын үйлдэл хийх эрх — admin.html-ийн `applyLocks` (:985-989).
 *
 * Хадгалаагүй мэдээнд (id === null) ямар ч үйлдэл хийхгүй: серверийн мутаци
 * үргэлж байгаа мэдээний id-г авна. Эхлээд хадгална, дараа нь илгээнэ.
 */
export function canAct(actor: Actor, post: PostRef, action: WorkflowAction): boolean {
  if (post.id === null) return false;

  const chief = CHIEFS.includes(actor.role);

  switch (action) {
    case "submit": {
      const may =
        actor.role === "REPORTER" || actor.role === "CONTRIBUTOR" || chief;
      return may && OWN_EDIT.includes(post.status) && (own(actor, post) || chief);
    }
    case "approve":
      return (actor.role === "REVIEWER" || chief) && post.status === "REVIEW";
    case "return":
      return (
        (actor.role === "REVIEWER" || chief) &&
        (post.status === "REVIEW" || post.status === "APPROVED")
      );
    case "publish":
      return chief && post.status !== "PUBLISHED";
    case "unpublish":
      return chief && post.status === "PUBLISHED";
  }
}

/** admin.html: `$('stwrap').hidden = !is('super')` — төлөвийг гараар солих */
export function canSetStatusManually(actor: Actor): boolean {
  return actor.role === "SUPER";
}

/** Мэдээний жагсаалтад харагдах төлөвүүд */
export function visibleStatuses(actor: Actor): NewsStatus[] {
  return [...VISIBLE[actor.role]];
}

/** admin.html-ийн `navSet` — сайтын тохиргоо */
export function canEditSettings(actor: Actor): boolean {
  return CAN_SETTINGS.includes(actor.role);
}
