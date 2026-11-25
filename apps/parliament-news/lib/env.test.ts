import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT_ENV = resolve(here, "../../../.env");
const CONFIG = resolve(here, "../next.config.js");

/**
 * Next нь .env-ийг ЗӨВХӨН аппын хавтаснаас хайдаг тул монорепогийн эхний
 * .env-ийг next.config.js зориуд уншина. Тэр уншилт унавал апп өгөгдлийн
 * санд холбогдож чадахгүй болно.
 *
 * Энэ тест өөрөө vitest.setup.ts-ээр .env-ийг уншсан байдаг тул хувьсагчийг
 * устгасан ТУСДАА процессоор шалгана — эс бөгөөс үргэлж ногоон байх болно.
 *
 * Root .env байхгүй орчинд (Vercel — env нь dashboard-аас ирдэг) шалгах зүйл
 * байхгүй тул өнгөрнө.
 */
describe("next.config.js", () => {
  it.skipIf(!existsSync(ROOT_ENV))("монорепогийн эхний .env-ийг уншина", () => {
    const script = [
      "delete process.env.NEWS_DATABASE_URL;",
      `require(${JSON.stringify(CONFIG)});`,
      'process.stdout.write(process.env.NEWS_DATABASE_URL ? "SET" : "MISSING");',
    ].join("\n");

    const out = execFileSync(process.execPath, ["-e", script], {
      encoding: "utf8",
      cwd: resolve(here, ".."),
    });

    expect(out.trim().endsWith("SET")).toBe(true);
  });
});
