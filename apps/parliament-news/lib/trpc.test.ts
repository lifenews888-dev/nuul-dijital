import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { requireRole } from "./trpc";

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
