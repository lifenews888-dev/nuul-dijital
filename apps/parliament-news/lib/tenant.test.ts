import { describe, it, expect } from "vitest";
import { tenantSlug, DEFAULT_TENANT_SLUG } from "./tenant";

describe("tenantSlug", () => {
  it("тохируулаагүй бол parlament", () => {
    expect(tenantSlug({})).toBe("parlament");
    expect(DEFAULT_TENANT_SLUG).toBe("parlament");
  });

  it("env-ийн утгыг хэлбэржүүлж авна", () => {
    expect(tenantSlug({ NEWS_TENANT_SLUG: "  Khovd-News  " })).toBe("khovd-news");
  });

  it("хоосон утгыг үл хэрэгсэнэ", () => {
    expect(tenantSlug({ NEWS_TENANT_SLUG: "   " })).toBe("parlament");
    expect(tenantSlug({ NEWS_TENANT_SLUG: undefined })).toBe("parlament");
  });
});
