import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { requireRole, ctxActor } from "./trpc";
import type { Ctx } from "./trpc";

describe("requireRole", () => {
  it("зөвшөөрөгдсөн эрхийг гаргана", () => {
    expect(() => requireRole("CHIEF", ["SUPER", "CHIEF"])).not.toThrow();
  });
  it("бусдыг FORBIDDEN-ээр татгалзана", () => {
    expect(() => requireRole("REPORTER", ["SUPER", "CHIEF"])).toThrow(TRPCError);
  });
  it("гишүүн биш (null) хэрэглэгчийг татгалзана", () => {
    expect(() => requireRole(null, ["REPORTER"])).toThrow(TRPCError);
  });
});

/**
 * `editorialProcedure` нь «редакцын гишүүн эсэх»-ийг л хэлнэ. Эрхийн
 * функц бүр `Actor` шаарддаг тул контекстээс түүнийг гаргах нэг л газар
 * байх ёстой — мутаци бүр `ctx.session?.user?.id`-г өөрөө тайлбарлавал
 * аль нэг нь `undefined`-ийг зөвшөөрч, бүх эрхийн шалгалт «хэнийх ч
 * биш» мэдээн дээр ажиллана.
 */
describe("ctxActor", () => {
  const base = { db: null, tenantId: "t1" } as unknown as Ctx;

  it("эрх ба хэрэглэгчийн id-гаас Actor болгоно", () => {
    const ctx = { ...base, role: "CHIEF", session: { user: { id: "u1" } } } as unknown as Ctx;
    expect(ctxActor(ctx)).toEqual({ userId: "u1", role: "CHIEF" });
  });

  it("редакцын эрхгүй бол татгалзана", () => {
    const ctx = { ...base, role: null, session: { user: { id: "u1" } } } as unknown as Ctx;
    expect(() => ctxActor(ctx)).toThrow(TRPCError);
  });

  it("нэвтрээгүй бол татгалзана", () => {
    const ctx = { ...base, role: "CHIEF", session: null } as unknown as Ctx;
    expect(() => ctxActor(ctx)).toThrow(TRPCError);
  });

  /** Сесс байгаад id нь байхгүй гэдэг нь бүр аюултай: хэнийх ч биш */
  it("сесстэй ч id-гүй бол татгалзана", () => {
    const ctx = { ...base, role: "CHIEF", session: { user: {} } } as unknown as Ctx;
    expect(() => ctxActor(ctx)).toThrow(TRPCError);
  });
});
