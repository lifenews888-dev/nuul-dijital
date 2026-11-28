import type { NewsStatus } from "@nuul/db-news";
import type { StudioPostFull } from "./studio-post";
import { FIELD_SECTION, type PostInput } from "./studio-post-input";
import type { Section } from "./permissions";

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
  storyUrl: string;
  storyDays: number;
};

export type EditorAction =
  | { type: "set"; field: keyof EditorState; value: unknown }
  /** `key: null` нь бүхэл `look`-ийг цэвэрлэнэ — «Анхны байдалд» */
  | { type: "look"; key: string | null; value: unknown }
  /**
   * Хадгалсны дараа: серверээс ирсэн ШИНЭ `updatedAt`-ийг тавина.
   *
   * Үгүй бол нэг хуудас ачаалалтад ЗӨВХӨН НЭГ УДАА хадгалж болно —
   * хоёр дахь нь хуучин тэмдгээ илгээж, сервер «өөр хүн засаж
   * өөрчлөгдсөн» гэсэн ХУУРАМЧ зөрчил буцаана.
   */
  | { type: "saved"; id: string; updatedAt: string }
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
    storyUrl: "",
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

/**
 * Сторины сонгосон хугацааг сэргээнэ.
 *
 * ҮЛДСЭН хугацаагаар тооцож БОЛОХГҮЙ: 7 хоногийн стори гурав дахь өдөр
 * засагдахад «4 хоног үлдсэн» гэж уншаад дахин 7 хоног авна. Өдөр бүр
 * засагддаг мэдээ ХЭЗЭЭ Ч дуусахгүй болно (artifact нь хадгалсан
 * `storyUntil`-ийг хэвээр үлдээдэг — `admin.html:1049`).
 *
 * Иймд ҮҮССЭНЭЭС нь тоолно: `storyUntil - createdAt`.
 */
export function storyDaysOf(post: StudioPostFull, now: Date = new Date()): number {
  if (!post.story) return 1;
  /** Хугацаагүй стори */
  if (!post.storyUntil) return 0;

  /** Хугацаа нь өнгөрсөн бол сонголтыг таамаглахгүй — дахин сунгахгүй */
  if (post.storyUntil.getTime() <= now.getTime()) return 0;

  const span = Math.round((post.storyUntil.getTime() - post.createdAt.getTime()) / 86_400_000);
  for (const allowed of [1, 3, 7]) {
    if (span <= allowed) return allowed;
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
    storyUrl: post.storyUrl ?? "",
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

/**
 * Формын төлөвөөс серверийн оролт руу.
 *
 * `allowed` өгвөл ЗУРАГДСАН хэсгийн талбарыг л илгээнэ. Үгүй бол
 * сэтгүүлч өөрийн ноорогоо хадгалах бүрт «Эрх хүрэхгүй тул хадгалаагүй
 * талбар: channels, featured, story…» гэсэн сэрэмжлүүлэг авна — тэр
 * талбарууд формд нь ОГТ БАЙГААГҮЙ. `dropped` нь жинхэнэ асуудлыг
 * барихын тулд байгаа; өдөр бүр хуцдаг бол хэн ч сонсохоо болино.
 */
export function editorToInput(state: EditorState, allowed?: Section[]): PostInput {
  const full: PostInput = {
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
    /** `BillStage`-д `label` багана БАЙХГҮЙ — зөвхөн `index` ба `note` */
    billSteps: state.billNotes.map((note) => ({ note })),
    channels: state.channels,
    featured: state.featured,
    story: state.story,
    storyDays: state.storyDays,
    /**
     * Төлөвийг ЗӨВХӨН байгаа мэдээнд илгээнэ. Шинэ мэдээ үргэлж ноорог
     * болж үүснэ (сервер ч дарна). Сервер нь `canSetStatusManually`-аар
     * шүүх тул эрхгүй хүний илгээсэн төлөв `dropped`-д орно.
     */
    ...(state.id ? { status: state.status } : {}),
  };

  if (!allowed) return full;

  const sections = new Set<Section>(allowed);
  const out: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(full)) {
    const section = FIELD_SECTION[field];
    /** Хэсэггүй талбарууд (id, title, date, status…) үргэлж явна */
    if (!section || sections.has(section)) out[field] = value;
  }
  return out as PostInput;
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
    case "saved":
      /** Хэрэглэгчийн бичсэнийг ХӨНДӨХГҮЙ — зөвхөн таних тэмдгүүдийг */
      return { ...state, id: action.id, expectedUpdatedAt: action.updatedAt };
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
