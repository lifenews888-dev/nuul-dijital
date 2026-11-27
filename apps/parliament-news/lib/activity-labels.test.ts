import { describe, it, expect } from "vitest";
import { ACTION_LABELS, actionLabel } from "./activity-labels";

/**
 * Бүртгэлийн үйлдлийн нэрс — `admin.html:857`-ийн `ACTN`.
 *
 * `action` нь өгөгдлийн санд ЧӨЛӨӨТ тэмдэгт мөр (`NewsActivity.action`
 * нь String). Иймд танихгүй утга орж ирэх нь мэдээж — хуучин мөр,
 * дараа нэмэгдэх үйлдэл, гараар оруулсан өгөгдөл. Тэр үед мөр нь
 * ХООСОРЧ болохгүй: бүртгэл нь «хэн юу хийсэн» гэдэг хариулт, хариулт
 * нь хоосон байвал бүртгэл байхгүйтэй адил.
 */
describe("actionLabel", () => {
  it("artifact-ийн үйлдлийн нэрс", () => {
    expect(actionLabel("create")).toBe("Үүсгэсэн");
    expect(actionLabel("save")).toBe("Хадгалсан");
    expect(actionLabel("submit")).toBe("Хянуулахаар илгээсэн");
    expect(actionLabel("approve")).toBe("Баталсан");
    expect(actionLabel("return")).toBe("Буцаасан");
    expect(actionLabel("publish")).toBe("Нийтэлсэн");
    expect(actionLabel("unpublish")).toBe("Сайтаас буулгасан");
    expect(actionLabel("status")).toBe("Төлөв өөрчилсөн");
    expect(actionLabel("delete")).toBe("Устгасан");
  });

  it("танихгүй үйлдлийг түүхий нэрээр нь — бүртгэл хоосорохгүй", () => {
    expect(actionLabel("whatever")).toBe("whatever");
  });

  it("хоосон утгад ч юм хэлнэ", () => {
    expect(actionLabel("")).toBe("Үйлдэл");
    expect(actionLabel("   ")).toBe("Үйлдэл");
  });

  it("Task 7-ийн бичдэг үйлдэл бүр шошготой", () => {
    for (const action of ["submit", "approve", "return", "publish", "unpublish", "delete"]) {
      expect(ACTION_LABELS[action]).toBeDefined();
      expect(actionLabel(action)).not.toBe(action);
    }
  });
});
