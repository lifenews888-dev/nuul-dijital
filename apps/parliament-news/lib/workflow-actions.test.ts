import { describe, it, expect } from "vitest";
import type { NewsRole } from "@nuul/db-news";
import { actionsFor, ACTION_BUTTONS, type ActionTone } from "./workflow-actions";
import type { Actor, PostRef, WorkflowAction } from "./permissions";

const act = (role: NewsRole, userId = "u1"): Actor => ({ userId, role });
const post = (p: Partial<PostRef> = {}): PostRef => ({
  id: "p1",
  status: "DRAFT",
  authorId: "u1",
  ...p,
});

const names = (a: Actor, p: PostRef): WorkflowAction[] => actionsFor(a, p).map((x) => x.action);

/**
 * Жагсаалтын мөр дээр ЯМАР товч гарах вэ.
 *
 * Хоёр зүйлийг нэгтгэнэ: `canAct`-ийн шийдвэр ба `admin.html`-ийн
 * товчны текст. Товчийг зөв нуух нь хамгаалалт БИШ (сервер өөрөө
 * шалгана) — харин дарж болохгүй товч дүүрэн мөр нь редакторыг
 * FORBIDDEN руу хөтөлнө.
 */
describe("actionsFor", () => {
  it("сэтгүүлчийн ноорог дээр зөвхөн илгээх", () => {
    expect(names(act("REPORTER"), post())).toEqual(["submit"]);
  });

  it("сэтгүүлчийн бусдын мэдээ дээр юу ч байхгүй", () => {
    expect(names(act("REPORTER"), post({ authorId: "u2" }))).toEqual([]);
  });

  it("хянагч хянагдаж буй дээр батлах, буцаах", () => {
    expect(names(act("REVIEWER"), post({ status: "REVIEW" }))).toEqual(["approve", "return"]);
  });

  it("хянагч нийтлэх товчгүй", () => {
    expect(names(act("REVIEWER"), post({ status: "APPROVED" }))).not.toContain("publish");
  });

  it("ахлах редактор батлагдсан дээр нийтлэнэ", () => {
    expect(names(act("CHIEF"), post({ status: "APPROVED" }))).toContain("publish");
  });

  it("ахлах редактор нийтлэгдсэн дээр буулгана, нийтлэхгүй", () => {
    const got = names(act("CHIEF"), post({ status: "PUBLISHED" }));
    expect(got).toContain("unpublish");
    expect(got).not.toContain("publish");
  });

  it("шинжээч юу ч харахгүй", () => {
    for (const status of ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "RETURNED"] as const) {
      expect(names(act("ANALYST"), post({ status }))).toEqual([]);
      expect(names(act("LIVE"), post({ status }))).toEqual([]);
    }
  });

  it("дараалал нь урсгалын дагуу — илгээх, батлах, буцаах, нийтлэх, буулгах", () => {
    const got = names(act("SUPER"), post({ status: "REVIEW" }));
    expect(got).toEqual(["approve", "return", "publish"]);
  });

  it("буцаах нь тайлбар шаардана, бусад нь шаардахгүй", () => {
    const returnAction = actionsFor(act("REVIEWER"), post({ status: "REVIEW" })).find(
      (a) => a.action === "return",
    );
    expect(returnAction?.needsNote).toBe(true);

    const approve = actionsFor(act("REVIEWER"), post({ status: "REVIEW" })).find(
      (a) => a.action === "approve",
    );
    expect(approve?.needsNote).toBe(false);
  });
});

describe("ACTION_BUTTONS", () => {
  it("admin.html-ийн товчны текст", () => {
    expect(ACTION_BUTTONS.submit.label).toBe("Хянуулахаар илгээх →");
    expect(ACTION_BUTTONS.approve.label).toBe("✓ Батлах");
    expect(ACTION_BUTTONS.return.label).toBe("↩ Буцаах");
    expect(ACTION_BUTTONS.publish.label).toBe("Нийтлэх");
    expect(ACTION_BUTTONS.unpublish.label).toBe("Нийтлэлээс буулгах");
  });

  it("утсан дээрх богино текст ч бий", () => {
    expect(ACTION_BUTTONS.submit.short).toBe("Илгээх →");
    expect(ACTION_BUTTONS.unpublish.short).toBe("Буулгах");
  });

  it("өнгөний ангилал нь admin.html-ийн .pri/.dng/.pub/.sec", () => {
    const tones: Record<WorkflowAction, ActionTone> = {
      submit: "primary",
      approve: "primary",
      return: "danger",
      publish: "publish",
      unpublish: "secondary",
    };
    for (const [action, tone] of Object.entries(tones)) {
      expect(ACTION_BUTTONS[action as WorkflowAction].tone).toBe(tone);
    }
  });

  it("таван үйлдэл бүгд товчтой", () => {
    expect(Object.keys(ACTION_BUTTONS).sort()).toEqual([
      "approve",
      "publish",
      "return",
      "submit",
      "unpublish",
    ]);
  });
});
