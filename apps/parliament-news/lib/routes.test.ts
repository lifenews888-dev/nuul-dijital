import { describe, it, expect } from "vitest";
import { needsStudioAuth } from "./routes";

describe("needsStudioAuth", () => {
  it("редакцын бүх зам нэвтрэлт шаардна", () => {
    expect(needsStudioAuth("/studio")).toBe(true);
    expect(needsStudioAuth("/studio/")).toBe(true);
    expect(needsStudioAuth("/studio/posts")).toBe(true);
    expect(needsStudioAuth("/studio/settings/team")).toBe(true);
  });

  it("зөвхөн signin хуудас нэвтрэлтгүй", () => {
    expect(needsStudioAuth("/studio/signin")).toBe(false);
    expect(needsStudioAuth("/studio/signin/callback")).toBe(false);
  });

  it("signin-тэй төстэй зам мултрахгүй", () => {
    expect(needsStudioAuth("/studio/signin-anything")).toBe(true);
    expect(needsStudioAuth("/studio/signinfoo")).toBe(true);
  });

  it("редакцын бус замд хамаарахгүй", () => {
    expect(needsStudioAuth("/")).toBe(false);
    expect(needsStudioAuth("/news/tosov")).toBe(false);
    expect(needsStudioAuth("/studiox")).toBe(false);
  });
});
