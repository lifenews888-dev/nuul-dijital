import { describe, it, expect } from "vitest";
import { TENANT_MODELS, forTenant } from "./tenant-db";

const A = "tenant-a";
const B = "tenant-b";

describe("TENANT_MODELS", () => {
  it("контентын моделиудыг хамарч, дамжин холбогдохыг оруулахгүй", () => {
    expect(TENANT_MODELS).toContain("NewsPost");
    expect(TENANT_MODELS).toContain("TenantSetting");
    expect(TENANT_MODELS).toContain("FxRate");
    expect(TENANT_MODELS).not.toContain("BillStage");
    expect(TENANT_MODELS).not.toContain("User");
    expect(TENANT_MODELS).not.toContain("Website");
  });
});

describe("хориглосон үйлдлүүд (DB-д хүрэхгүй)", () => {
  it("findUnique-ийг татгалзана", async () => {
    await expect(forTenant(A).newsPost.findUnique({ where: { id: "x" } })).rejects.toThrow(/findFirst/);
  });

  it("update, delete-ийг татгалзана", async () => {
    await expect(forTenant(A).newsPost.update({ where: { id: "x" }, data: {} })).rejects.toThrow(/updateMany/);
    await expect(forTenant(A).newsPost.delete({ where: { id: "x" } })).rejects.toThrow(/deleteMany/);
  });

  it("upsert-ийг татгалзана", async () => {
    await expect(
      forTenant(A).tenantSetting.upsert({ where: { id: "x" }, create: {} as never, update: {} }),
    ).rejects.toThrow(/upsert/);
  });

  it("өөр tenant-ийн мөр үүсгэхийг татгалзана", async () => {
    await expect(
      forTenant(A).newsPost.create({
        data: { tenantId: B, slug: "x", title: "Хог", date: new Date() },
      }),
    ).rejects.toThrow(/tenantId/);
  });
});
