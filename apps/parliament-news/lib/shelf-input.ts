/**
 * Тавиурын оролтын шийдвэрүүд — цэвэр тооцоо.
 *
 * Artifact-ийн `index.html:906-911`-ийн хамгаалалтууд. Эдгээрийг компонентод
 * шууд бичвэл тест хүрэхгүй: алдаа нь яг энд (дугуйны хамгаалалт, дарлат
 * ба чирэлтийн ялгаа, хөрш ном дээр дарах) гардаг.
 */

/** Чирэлт гэж тооцох хамгийн бага зай, пикселээр */
export const DRAG_THRESHOLD = 5;

/** Дугуйны хөдөлгөөнийг номоор хөрвүүлэх коэффициент */
export const WHEEL_SCALE = 0.5;

/** Хуудас энэ хэмжээнээс их гүйсэн бол дугуй нь зөвхөн хуудсыг гүйлгэнэ */
export const SCROLL_LOCK = 4;

export type WheelContext = {
  /** `window.scrollY` */
  scrollY: number;
  /** Заагчийн босоо байрлал, viewport-д */
  pointerY: number;
  /** Тавиурын зурвасын дээд, доод ирмэг */
  top: number;
  bottom: number;
  /** Нэг номын хэвтээ алхам (ws + gap) */
  step: number;
};

/**
 * Дугуйны нэг үйлдэл хэдэн ном эргүүлэх вэ. `null` бол тавиур ХӨНДӨХГҮЙ —
 * хуудас өөрөө гүйнэ.
 *
 * Artifact-ийн хоёр хамгаалалт:
 *   1. `scrollY > 4` — урсгал руу буух үед тавиур эргэлдэхгүй
 *   2. босоо дугуй нь зөвхөн заагч тавиурын зурваст байхад
 *
 * Хоёулангүйгээр нүүрээс доош гүйлгэхэд тавиур нэгэн зэрэг эргэлдэж,
 * хэрэглэгч өөр мэдээн дээр очно.
 */
export function wheelStep(
  e: { deltaX: number; deltaY: number },
  ctx: WheelContext,
): number | null {
  if (ctx.step <= 0) return null;
  if (ctx.scrollY > SCROLL_LOCK) return null;

  const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
  if (!horizontal && (ctx.pointerY < ctx.top || ctx.pointerY > ctx.bottom)) return null;

  const delta = horizontal ? e.deltaX : e.deltaY;
  if (delta === 0) return null;
  return (delta / ctx.step) * WHEEL_SCALE;
}

export type ClickAction = { kind: "open" } | { kind: "rotate"; by: number };

/**
 * Ном дээр дарахад юу болох вэ — artifact-ийн `index.html:906`.
 *
 * `rel` нь дарсан номын одоогийн байрлалаас хэдэн номын зайд байгаа.
 * Хагасаас ойр бол тэр нь урдах ном — мэдээг нээнэ. Үгүй бол түүнийг
 * урагш эргүүлнэ: хөрш ном дээр дарахад юу ч болохгүй байх нь номын
 * тавиурын хамгийн ойлгомжтой үйлдлийг үхүүлнэ.
 */
export function clickAction(rel: number): ClickAction {
  if (Math.abs(rel) < 0.5) return { kind: "open" };
  return { kind: "rotate", by: Math.round(rel) };
}

/** Босго давсан уу — давсан бол дарлат биш, чирэлт */
export function dragMoved(startX: number, x: number): boolean {
  return Math.abs(x - startX) > DRAG_THRESHOLD;
}
