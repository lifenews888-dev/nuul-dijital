import { canAct, type Actor, type PostRef, type WorkflowAction } from "./permissions";

/**
 * Урсгалын товчнууд — `admin.html:663-672`-ийн `.actbar`.
 *
 * Эрхийн шийдвэр нь `lib/permissions.ts`-д; энд зөвхөн ХАРАГДАХ хэлбэр:
 * текст, өнгө, тайлбар шаардах эсэх. Хоёрыг нэг файлд хольвол UI-ийн
 * шошго засах нь эрхийн кодыг хөндөх болно.
 */

export type ActionTone = "primary" | "danger" | "publish" | "secondary";

export type ActionButton = {
  /** Дэлгэц өргөн үед */
  label: string;
  /** Утсан дээр — admin.html-ийн `.sh` */
  short: string;
  tone: ActionTone;
  /** Хянагчийн буцаалт нь ТАЙЛБАРГҮЙ бол сэтгүүлч юу засахаа мэдэхгүй */
  needsNote: boolean;
};

export const ACTION_BUTTONS: Record<WorkflowAction, ActionButton> = {
  submit: {
    label: "Хянуулахаар илгээх →",
    short: "Илгээх →",
    tone: "primary",
    needsNote: false,
  },
  approve: { label: "✓ Батлах", short: "✓ Батлах", tone: "primary", needsNote: false },
  return: { label: "↩ Буцаах", short: "↩ Буцаах", tone: "danger", needsNote: true },
  publish: { label: "Нийтлэх", short: "Нийтлэх", tone: "publish", needsNote: false },
  unpublish: {
    label: "Нийтлэлээс буулгах",
    short: "Буулгах",
    tone: "secondary",
    needsNote: false,
  },
};

/** admin.html-ийн `.actbar`-ийн дараалал — урсгалаар */
const ORDER: WorkflowAction[] = ["submit", "approve", "return", "publish", "unpublish"];

export type AvailableAction = ActionButton & { action: WorkflowAction };

/**
 * Энэ хүн энэ мэдээн дээр ямар үйлдэл хийж чадах вэ.
 *
 * Товчийг нуух нь хамгаалалт БИШ — `studioNews.act` нь мөн `canAct`-ийг
 * дуудна. Энэ нь зөвхөн дарж болохгүй товчийг харуулахгүй байх тул:
 * FORBIDDEN гэсэн хариу нь хэрэглэгчийн алдаа биш, бидний алдаа.
 */
export function actionsFor(actor: Actor, post: PostRef): AvailableAction[] {
  return ORDER.filter((action) => canAct(actor, post, action)).map((action) => ({
    action,
    ...ACTION_BUTTONS[action],
  }));
}
