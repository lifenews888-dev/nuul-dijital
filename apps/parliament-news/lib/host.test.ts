import { describe, it, expect } from "vitest";
import { parseHost } from "./host";

describe("parseHost", () => {
  it("домэйныг хэлбэржүүлнэ", () => {
    expect(parseHost("parlamentnews.mn")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("WWW.ParlamentNews.MN")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("parlamentnews.mn:3000")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("parlamentnews.mn.")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
  });
  it("localhost дээрх subdomain-ыг tenant slug гэж үзнэ", () => {
    expect(parseHost("parlament.localhost:3001")).toEqual({ kind: "subdomain", value: "parlament" });
  });
  it("танихгүй оролтод unknown буцаана", () => {
    expect(parseHost(null)).toEqual({ kind: "unknown", value: null });
    expect(parseHost("")).toEqual({ kind: "unknown", value: null });
    expect(parseHost("localhost:3001")).toEqual({ kind: "unknown", value: null });
    expect(parseHost("127.0.0.1:3001")).toEqual({ kind: "unknown", value: null });
  });
});
