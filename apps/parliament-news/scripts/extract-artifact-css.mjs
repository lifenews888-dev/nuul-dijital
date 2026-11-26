/**
 * `site-v2/index.html`-ийн <style> блокийг `app/artifact.css` болгон гаргана.
 *
 * Гараар хуулахгүй байх нь зориуд: artifact шинэчлэгдвэл энэ скриптийг дахин
 * ажиллуулж, гар аргын завсрын алхамгүйгээр шинэчилнэ.
 *
 *   node scripts/extract-artifact-css.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "..", "site-v2", "index.html");
const OUT = join(here, "..", "app", "artifact.css");

/** artifact-ийн харьцангуй зам → аппын нийтийн зам */
const ASSET_PREFIX = "/artifact/";
const ASSETS = [
  "city.svg",
  "flag.svg",
  "flag.jpg",
  "logo.png",
  "logo-white.png",
  "thumb.jpg",
];

const html = await readFile(SRC, "utf8");

const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
if (blocks.length !== 1) {
  throw new Error(`<style> блок 1 байх ёстой, ${blocks.length} олдлоо`);
}

let css = blocks[0];

// url(city.svg) → url(/artifact/city.svg). Хашилттай ба хашилтгүй хоёуланг нь.
let rewritten = 0;
for (const name of ASSETS) {
  const re = new RegExp(`url\\((['"]?)(?:\\./)?${name.replace(".", "\\.")}\\1\\)`, "g");
  css = css.replace(re, () => {
    rewritten += 1;
    return `url(${ASSET_PREFIX}${name})`;
  });
  // `img/flag.jpg`, `media/poster.jpg` маягийн дэд хавтастай зам
  const reDir = new RegExp(`url\\((['"]?)(?:\\./)?(?:img|media)/${name.replace(".", "\\.")}\\1\\)`, "g");
  css = css.replace(reDir, () => {
    rewritten += 1;
    return `url(${ASSET_PREFIX}${name})`;
  });
}

const header = `/*
 * ГАРААР ЗАСАХГҮЙ.
 *
 * Эх сурвалж: apps/parliament-news/site-v2/index.html-ийн <style> блок.
 * Дахин гаргах: node scripts/extract-artifact-css.mjs
 *
 * Энэ бол дизайны ЭХ СУРВАЛЖ. Зөрчилдвөл энэ ялна — тиймээс globals.css-ийн
 * Tailwind-ийн дараа ачаалагдана. Зургийн замууд /artifact/… болж солигдсон.
 */
`;

await writeFile(OUT, header + css.trim() + "\n", "utf8");

const rules = (css.match(/\{/g) || []).length;
console.log(`artifact.css: ${css.length} bytes, ${rules} rules, ${rewritten} asset urls rewritten`);
