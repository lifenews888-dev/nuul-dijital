import type { NewsRole, NewsStatus } from "@nuul/db";

/**
 * Редакцын эрх ба зөвшөөрөл.
 * Эх сурвалж: site-v2/admin.html:844-886 (ROLES, SECS, canDel, canNew, navSet).
 * UI-д нуух нь хамгаалалт биш — tRPC procedure бүр эдгээрийг шалгана.
 */

export type Section = "basic" | "photos" | "video" | "bill" | "src" | "look" | "pub";

export const ROLE_LABELS: Record<NewsRole, { name: string; desc: string }> = {
  SUPER: {
    name: "Супер админ",
    desc: "Бүх эрх: хэрэглэгчид эрх олгох, бүх мэдээ, тохиргоо, төлөвийг гараар солих",
  },
  CHIEF: {
    name: "Ерөнхий редактор",
    desc: "Бүх мэдээг засах, батлах, буцаах, нийтлэх, нийтлэлээс буулгах, устгах",
  },
  REVIEWER: {
    name: "Хянагч",
    desc: "Хянагдаж буй мэдээг засах, батлах эсвэл тайлбартай буцаах. Нийтлэхгүй",
  },
  REPORTER: {
    name: "Сэтгүүлч",
    desc: "Мэдээ бичих, зураг видео оруулах, хянуулахаар илгээх. Зөвхөн өөрийн ноорог, буцаасан мэдээг засна",
  },
  MEDIA: {
    name: "Зураг, видео редактор",
    desc: "Нийтлэгдээгүй мэдээний зураг, видео, тайлбарыг засна. Текстэд хүрэхгүй",
  },
  LEGAL: {
    name: "Хуулийн мэдээний хариуцагч",
    desc: "Хуулийн төслийн шат, санал хураалт, шат бүрийн тайлбарыг засна",
  },
  SOCIAL: {
    name: "Сошиал менежер",
    desc: "Нийтлэх сувгууд болон сошиал постын текстийг засна",
  },
  LIVE: {
    name: "Шууд дамжуулалтын оператор",
    desc: "Ирц, хуралдааны төлөв, өнөөдрийн хөтөлбөр, «ШУУД» мөрийг удирдана",
  },
  CONTRIBUTOR: {
    name: "Зочин зохиогч",
    desc: "Зөвхөн өөрийн ноорог бичиж хянуулахаар илгээнэ. Зураг, видео оруулахгүй",
  },
  ANALYST: {
    name: "Шинжээч",
    desc: "Самбар, жагсаалтыг зөвхөн харна",
  },
};

const ALL_SECTIONS: Section[] = ["basic", "photos", "video", "bill", "src", "look", "pub"];

const SECTIONS: Record<NewsRole, Section[]> = {
  SUPER: ALL_SECTIONS,
  CHIEF: ALL_SECTIONS,
  REVIEWER: ALL_SECTIONS,
  REPORTER: ["basic", "photos", "video", "bill", "src", "look"],
  CONTRIBUTOR: ["basic", "src", "look"],
  MEDIA: ["photos", "video"],
  LEGAL: ["bill", "src"],
  SOCIAL: ["pub"],
  LIVE: [],
  ANALYST: [],
};

const ALL_STATUSES: NewsStatus[] = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "RETURNED"];
const UNPUBLISHED: NewsStatus[] = ["DRAFT", "REVIEW", "APPROVED", "RETURNED"];

const STATUSES: Record<NewsRole, NewsStatus[]> = {
  SUPER: ALL_STATUSES,
  CHIEF: ALL_STATUSES,
  REVIEWER: ALL_STATUSES,
  REPORTER: ALL_STATUSES,
  CONTRIBUTOR: ALL_STATUSES,
  MEDIA: UNPUBLISHED,
  LEGAL: UNPUBLISHED,
  SOCIAL: ["APPROVED", "PUBLISHED"],
  LIVE: ["PUBLISHED"],
  ANALYST: ["PUBLISHED"],
};

const CAN_CREATE: NewsRole[] = ["SUPER", "CHIEF", "REVIEWER", "REPORTER", "CONTRIBUTOR"];
const CAN_SETTINGS: NewsRole[] = ["SUPER", "CHIEF", "LIVE"];
const OWN_EDIT_STATUSES: NewsStatus[] = ["DRAFT", "RETURNED"];

/** Шат алгасахыг хориглох шилжилтийн хүснэгт */
const TRANSITIONS: Record<NewsRole, Array<[NewsStatus, NewsStatus]>> = {
  SUPER: ALL_STATUSES.flatMap((from) =>
    ALL_STATUSES.filter((to) => to !== from).map((to) => [from, to] as [NewsStatus, NewsStatus]),
  ),
  CHIEF: ALL_STATUSES.flatMap((from) =>
    ALL_STATUSES.filter((to) => to !== from).map((to) => [from, to] as [NewsStatus, NewsStatus]),
  ),
  REVIEWER: [
    ["REVIEW", "APPROVED"],
    ["REVIEW", "RETURNED"],
    ["APPROVED", "RETURNED"],
  ],
  REPORTER: [
    ["DRAFT", "REVIEW"],
    ["RETURNED", "REVIEW"],
  ],
  CONTRIBUTOR: [
    ["DRAFT", "REVIEW"],
    ["RETURNED", "REVIEW"],
  ],
  MEDIA: [],
  LEGAL: [],
  SOCIAL: [],
  LIVE: [],
  ANALYST: [],
};

export function canCreate(role: NewsRole | null): boolean {
  return role !== null && CAN_CREATE.includes(role);
}

export function canEditSettings(role: NewsRole | null): boolean {
  return role !== null && CAN_SETTINGS.includes(role);
}

export function editableSections(role: NewsRole | null): Section[] {
  return role === null ? [] : [...SECTIONS[role]];
}

export function visibleStatuses(role: NewsRole | null): NewsStatus[] {
  return role === null ? [] : [...STATUSES[role]];
}

export function canDelete(
  role: NewsRole | null,
  post: { authorId: string | null; status: NewsStatus },
  userId: string,
): boolean {
  if (role === null) return false;
  if (role === "SUPER" || role === "CHIEF") return true;

  if (role === "REPORTER" || role === "CONTRIBUTOR") {
    return post.authorId === userId && OWN_EDIT_STATUSES.includes(post.status);
  }

  return false;
}

export function canTransition(
  role: NewsRole | null,
  from: NewsStatus,
  to: NewsStatus,
): boolean {
  if (role === null) return false;
  return TRANSITIONS[role].some(([f, t]) => f === from && t === to);
}
