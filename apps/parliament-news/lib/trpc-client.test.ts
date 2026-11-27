import { describe, it, expect } from "vitest";
import { trpcMessage } from "./trpc-client";

/**
 * Серверийн эрхийн мессежүүд монгол. Сүлжээний, Next-ийн, fetch-ийн
 * алдаа нь англи — тэднийг редакторт үзүүлэх нь юу ч хэлэхгүй
 * («TypeError: Failed to fetch»). Иймд кирилл үсэг байгаа эсэхээр
 * «хүнд зориулсан мессеж» эсэхийг шийднэ.
 */
describe("trpcMessage", () => {
  it("серверийн монгол мессежийг шууд дамжуулна", () => {
    expect(trpcMessage(new Error("Энэ үйлдлийн эрх алга"))).toBe("Энэ үйлдлийн эрх алга");
    expect(trpcMessage(new Error("Мэдээ олдсонгүй"))).toBe("Мэдээ олдсонгүй");
  });

  it("англи техникийн алдааг ерөнхий мессежээр солино", () => {
    expect(trpcMessage(new Error("TypeError: Failed to fetch"))).toBe(
      "Холболтын алдаа — дахин оролдоно уу",
    );
    expect(trpcMessage(new Error("UNAUTHORIZED"))).toBe("Холболтын алдаа — дахин оролдоно уу");
  });

  it("Error биш юу ч ирсэн эвдэрхгүй", () => {
    expect(trpcMessage(null)).toBe("Холболтын алдаа — дахин оролдоно уу");
    expect(trpcMessage("мөр")).toBe("Холболтын алдаа — дахин оролдоно уу");
    expect(trpcMessage(undefined)).toBe("Холболтын алдаа — дахин оролдоно уу");
  });
});
