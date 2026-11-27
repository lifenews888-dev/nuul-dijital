import type { NewsStatus } from "@nuul/db-news";
import type { StudioPostFull } from "./studio-post";
import type { PostInput } from "./studio-post-input";

/**
 * Засварлагчийн формын төлөв — НЭГ объект, нэг reducer.
 *
 * Хэсэг бүр өөрийн `useState` барихгүй байх нь зориуд: хавтасны амьд
 * урьдчилан харалт нь гарчиг, ангилал, өнгө, зохиомж, зураг БҮГДЭЭС
 * хамаарна. Төлөв тарвал урьдчилан харалт нэг нэг талбараар хоцорч,
 * редактор номоо худал харна.
 *
 * Формын хэлбэр нь сангийнхаас ялгаатай хэд хэдэн газар бий: огноо нь
 * `YYYY-MM-DD` мөр, шошго нь таслалтай нэг мөр. Хөрвүүлэлт нь ЗӨВХӨН
 * энд — компонент дотор тараавал хоёр тал салж эхэлнэ.
 */

/** admin.html-ийн `blank()`-ийн сувгууд */
export const DEFAULT_CHANNELS = ["Сайт", "Facebook", "YouTube"];

/** admin.html-ийн `blank()`-ийн анхдагч хээ — УИХ-ын танхим */
const DEFAULT_MOTIF = "hemi";

export type EditorState = {
  id: string | null;
  expectedUpdatedAt: string | null;
  status: NewsStatus;

  title: string;
  date: string;
  kicker: string;
  lead: string;
  body: string;
  categoryName: string;
  subcategory: string;
  reporter: string;
  /** Формд таслалтай нэг мөр — `editorToInput` нь массив болгоно */
  tagsText: string;

  sources: string[];

  motif: string;
  theme: number;
  look: Record<string, unknown>;

  billEnabled: boolean;
  billStage: number;
  votesYes: number;
  votesNo: number;
  billNotes: string[];

  channels: string[];
  featured: boolean;
  story: boolean;
  storyDays: number;
};

export type EditorAction =
  | { type: "set"; field: keyof EditorState; value: unknown }
  /** `key: null` нь бүхэл `look`-ийг цэвэрлэнэ — «Анхны байдалд» */
  | { type: "look"; key: string | null; value: unknown }
  | { type: "reset"; state: EditorState };

export function emptyEditor(today: string): EditorState {
  return {
    id: null,
    expectedUpdatedAt: null,
    status: "DRAFT",
    title: "",
    date: today,
    kicker: "",
    lead: "",
    body: "",
    categoryName: "",
    subcategory: "",
    reporter: "",
    tagsText: "",
    sources: [],
    motif: DEFAULT_MOTIF,
    theme: 0,
    look: {},
    billEnabled: false,
    billStage: 0,
    votesYes: 0,
    votesNo: 0,
    billNotes: ["", "", "", "", ""],
    channels: [...DEFAULT_CHANNELS],
    featured: false,
    story: false,
    storyDays: 1,
  };
}

/** `Date` → `YYYY-MM-DD`, UTC-ээр (огноо нь `@db.Date`, цагийн бүсгүй) */
function dateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function billNotesOf(post: StudioPostFull): string[] {
  const notes = ["", "", "", "", ""];
  for (const s of post.bill?.steps ?? []) {
    if (s.index >= 0 && s.index < notes.length) notes[s.index] = s.note ?? "";
  }
  return notes;
}

/** Сторины хугацааг үлдсэн хоногоос сэргээх — artifact-ийн сонголтууд */
function storyDaysOf(post: StudioPostFull): number {
  if (!post.story || !post.storyUntil) return post.story ? 0 : 1;
  const days = Math.round((post.storyUntil.getTime() - Date.now()) / 86_400_000);
  for (const allowed of [1, 3, 7]) {
    if (days <= allowed) return allowed;
  }
  return 7;
}

export function editorFromPost(post: StudioPostFull): EditorState {
  return {
    id: post.id,
    expectedUpdatedAt: post.updatedAt.toISOString(),
    status: post.status,
    title: post.title,
    date: dateInput(post.date),
    kicker: post.kicker ?? "",
    lead: post.lead ?? "",
    body: post.body ?? "",
    categoryName: post.categoryName ?? "",
    subcategory: post.subcategory ?? "",
    reporter: post.reporter ?? "",
    tagsText: post.tags.join(", "),
    sources: [...post.sources],
    motif: post.motif,
    theme: post.theme,
    look: (post.look as Record<string, unknown>) ?? {},
    billEnabled: post.bill !== null,
    billStage: post.bill?.stage ?? 0,
    votesYes: post.bill?.votesYes ?? 0,
    votesNo: post.bill?.votesNo ?? 0,
    billNotes: billNotesOf(post),
    channels: [...post.channels],
    featured: post.featured,
    story: post.story,
    storyDays: storyDaysOf(post),
  };
}

/**
 * Таслалтай мөрөөс шошгын жагсаалт.
 *
 * Хоосон, давхардсаныг хаяна: «Төсөв, төсөв» нь нийтлэлийн доор хоёр
 * ижил чип болж гарна.
 */
function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(",")) {
    const tag = raw.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

export function editorToInput(state: EditorState): PostInput {
  return {
    ...(state.id ? { id: state.id } : {}),
    ...(state.expectedUpdatedAt ? { expectedUpdatedAt: state.expectedUpdatedAt } : {}),
    title: state.title,
    date: state.date,
    kicker: state.kicker || null,
    lead: state.lead || null,
    body: state.body || null,
    categoryName: state.categoryName || null,
    subcategory: state.subcategory || null,
    reporter: state.reporter || null,
    tags: parseTags(state.tagsText),
    sources: state.sources,
    motif: state.motif,
    theme: state.theme,
    look: state.look,
    billEnabled: state.billEnabled,
    billStage: state.billStage,
    votesYes: state.votesYes,
    votesNo: state.votesNo,
    billSteps: state.billNotes.map((note, index) => ({ label: String(index), note })),
    channels: state.channels,
    featured: state.featured,
    story: state.story,
    storyDays: state.storyDays,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "look":
      return {
        ...state,
        look: action.key === null ? {} : { ...state.look, [action.key]: action.value },
      };
    case "reset":
      return action.state;
  }
}

/**
 * Хадгалаагүй өөрчлөлт байна уу — admin.html-ийн `dirty`.
 *
 * Гүн харьцуулалт: `look`, `sources`, `channels` нь объект, массив тул
 * лавлагааны харьцуулалт нь хадгалсны дараа ч «бохир» гэж хэлнэ, хүн
 * хуудас орхих болгонд хуурамч сэрэмжлүүлэг авна.
 */
export function isDirty(a: EditorState, b: EditorState): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
