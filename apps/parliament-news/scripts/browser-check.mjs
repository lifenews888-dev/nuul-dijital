/**
 * Хөтөч дээрх инвариантуудын шалгуур.
 *
 * Яагаад: энэ төлөвлөгөөний хамгийн ноцтой алдаанууд нь ЦЭВЭР ФУНКЦЭД БИШ,
 * ХОЛБОЛТОД байсан — курсор алга болсон, текст сонгогдохгүй, фонт
 * ачаалагдаагүй, чирэлт суллахад цэвэрлэгдээгүй, дугуй хуудсыг гүйлгэхийн
 * зэрэгцээ тавиурыг эргүүлсэн. Vitest эдгээрийг хүрэхгүй (DOM байхгүй),
 * screenshot ч хүрэхгүй (курсор, сонголт, фонтын орлуулалт зурагдахгүй).
 *
 * Ажиллуулах:  pnpm check:browser            (http://localhost:3014)
 *              pnpm check:browser <origin>
 *
 * Шаардлага: Chrome суусан байх, dev/prod сервер ажиллаж байх.
 */
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const ORIGIN = (process.argv[2] || "http://localhost:3014").replace(/\/+$/, "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** --- CDP-ийн хамгийн бага жолоодогч ----------------------------------- */

async function launch() {
  const { existsSync } = await import("node:fs");
  const bin = CHROME_PATHS.find((p) => existsSync(p));
  if (!bin) throw new Error("Chrome олдсонгүй: " + CHROME_PATHS.join(", "));
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), "pn-check-"));
  const chrome = spawn(
    bin,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--mute-audio",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--window-size=1280,900",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let wsUrl = null;
  for (let i = 0; i < 80 && !wsUrl; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? null;
    } catch {
      /* хараахан гараагүй */
    }
    if (!wsUrl) await sleep(250);
  }
  if (!wsUrl) throw new Error("Chrome CDP хариулсангүй");

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let id = 0;
  const waiting = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    const w = m.id && waiting.get(m.id);
    if (!w) return;
    waiting.delete(m.id);
    m.error ? w.reject(new Error(JSON.stringify(m.error))) : w.resolve(m.result);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id;
      waiting.set(n, { resolve, reject });
      ws.send(JSON.stringify({ id: n, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");

  return {
    send,
    async goto(path, { width = 1280, height = 900, reduced = false } = {}) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 500,
      });
      await send("Emulation.setEmulatedMedia", {
        features: [
          { name: "prefers-color-scheme", value: "dark" },
          ...(reduced ? [{ name: "prefers-reduced-motion", value: "reduce" }] : []),
        ],
      });
      await send("Page.navigate", { url: ORIGIN + path });
      await sleep(3200);
    },
    async evaluate(expression) {
      const r = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails) {
        throw new Error("Хуудсан дээрх алдаа: " + JSON.stringify(r.exceptionDetails));
      }
      return r.result?.value;
    },
    close() {
      ws.close();
      chrome.kill();
    },
  };
}

/** --- Шалгуурууд -------------------------------------------------------- */

const failures = [];
const pass = [];

function check(name, ok, detail) {
  if (ok) pass.push(name);
  else failures.push(`${name} — ${detail}`);
}

/**
 * Шалгуур хуудсыг УНАГААЖ ч болно.
 *
 * Жишээ нь «богино чирэлт мэдээг нээхгүй» нь эвдэрсэн үед хуудас үнэхээр
 * шилжиж, CDP-ийн бай алга болно. Тэр нь мэдээллийг алдагдуулах ёсгүй:
 * алдааг барьж, уналт болгон бүртгээд үлдсэнийг үргэлжлүүлнэ.
 */
async function guard(name, fn) {
  try {
    return await fn();
  } catch (err) {
    failures.push(`${name} — шалгах үед алдаа: ${String(err).slice(0, 180)}`);
    // Хуудас шилжсэн байж магад — үлдсэн шалгуурт зориулж буцааж нээнэ
    try {
      await page.goto("/");
    } catch {
      /* сэргэхгүй бол дараагийнх нь мөн бүртгэгдэнэ */
    }
    return null;
  }
}

// eslint-disable-next-line no-unused-vars -- guard дотроос хэрэглэгдэнэ
const page = await launch();

try {
  // ---- Нүүр, ширээний компьютер -----------------------------------------
  await page.goto("/");

  const css = await guard("CSS шалгуур", () => page.evaluate(`(() => {
    const cs = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e) : null; };
    return {
      bodyCursor: getComputedStyle(document.body).cursor,
      linkCursor: cs("header a")?.cursor,
      bodySelect: getComputedStyle(document.body).userSelect,
      spineFont: cs(".plate")?.fontFamily,
      tickerFont: cs(".tr")?.fontFamily,
      captionClamp: cs(".m.ct > span")?.webkitLineClamp,
    };
  })()`));

  // C1 — artifact нь өөрийн курсор зурдаг; бид түүнийг портлоогүй
  check("C1 body курсортой", css?.bodyCursor !== "none", `cursor: ${css?.bodyCursor}`);
  check("C1 толгойн холбоос заагчтай", css?.linkCursor === "pointer", `cursor: ${css?.linkCursor}`);

  // C2 — мэдээний сайт дээр текст сонгогдох ёстой
  check("C2 body сонгогдоно", css?.bodySelect !== "none", `user-select: ${css?.bodySelect}`);

  // C3 — next/font нь гэр бүлийн нэрийг hash-дна; шууд нэр ХЭЗЭЭ Ч тохирохгүй
  check(
    "C3 нуруу next/font хэрэглэнэ",
    /Inter_Tight/.test(css?.spineFont || ""),
    `font-family: ${css?.spineFont}`,
  );
  check(
    "C3 гүйдэг мөр next/font хэрэглэнэ",
    /Inter_Tight/.test(css?.tickerFont || ""),
    `font-family: ${css?.tickerFont}`,
  );

  // I6 — урт гарчиг цагийн шугам, хөлийг дарах ёсгүй
  check(
    "I6 гарчиг мөрөөр таслагдана",
    css?.captionClamp && css?.captionClamp !== "none",
    `line-clamp: ${css?.captionClamp}`,
  );

  // C4 — зурваснаас гадуур суллахад чирэлт цэвэрлэгдэх ёстой
  const drag = await guard("C4 чирэлт суллах", () => page.evaluate(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const shelf = document.getElementById("shelf");
    const r = shelf.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const ev = (t, x, yy, target) => target.dispatchEvent(
      new PointerEvent(t, { pointerId: 1, clientX: x, clientY: yy, bubbles: true, cancelable: true }));
    ev("pointerdown", 600, y, shelf);
    ev("pointermove", 500, y, window);
    await sleep(60);
    // Зурваснаас ГАДУУР суллана — artifact ч цонхонд сонсдог
    ev("pointerup", 500, r.bottom + 120, document.body);
    await sleep(900);
    const before = (document.querySelector(String.fromCharCode(35) + "cT span[data-in]")?.textContent ?? "");
    // Товч даралгүй хулгана хөдөлгөнө
    for (let i = 0; i < 12; i++) { ev("pointermove", 500 - i * 40, y, window); await sleep(16); }
    await sleep(900);
    return { before, after: (document.querySelector(String.fromCharCode(35) + "cT span[data-in]")?.textContent ?? "") };
  })()`));
  check("C4 суллалтын дараа чирэлт зогсоно", drag != null && drag.before === drag.after, `${drag ? `"${drag.before}" → "${drag.after}"` : "гүйцээгүй"}`);

  // I1 — богино чирэлт мэдээг НЭЭХ ЁСГҮЙ (хавтасны `<a>` бүх нүүрийг хучна)
  const dragClick = await guard("I1 чирэлтийн дараах дарлат", () => page.evaluate(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    scrollTo(0, 0); await sleep(300);
    const cover = document.querySelector(".tape .cv a");
    const r = cover.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const pe = (t, xx, target) => target.dispatchEvent(
      new PointerEvent(t, { pointerId: 2, clientX: xx, clientY: y, bubbles: true, cancelable: true }));
    pe("pointerdown", x, cover);
    pe("pointermove", x - 20, window);
    await sleep(40);
    pe("pointerup", x - 20, cover);
    // Чирэлтийн дараа хөтөч click гаргана — энэ нь залгигдах ёстой
    cover.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await sleep(900);
    return { path: location.pathname };
  })()`));
  check("I1 богино чирэлт мэдээг нээхгүй", dragClick != null && dragClick.path === "/", `очсон: ${dragClick?.path ?? "гүйцээгүй"}`);

  // I3 — хуудас гүйж эхэлсэн бол дугуй нь тавиурыг хөндөхгүй
  const wheel = await guard("I3 дугуй", () => page.evaluate(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    scrollTo(0, 0); await sleep(120);
    const shelf = document.getElementById("shelf");
    const r = shelf.getBoundingClientRect();
    scrollTo(0, 200);
    // Өмнөх шалгуурын эргэлт тогтсоны ДАРАА уншина: эс бөгөөс тэр нь
    // дугуйны буруу гэж бүртгэгдэнэ (пүрш ~1 сек амардаг)
    await sleep(1600);
    const before = (document.querySelector(String.fromCharCode(35) + "cT span[data-in]")?.textContent ?? "");
    for (let i = 0; i < 8; i++) {
      shelf.dispatchEvent(new WheelEvent("wheel", {
        deltaY: 120, clientY: r.top + r.height / 2, bubbles: true, cancelable: true }));
      await sleep(30);
    }
    await sleep(900);
    const after = (document.querySelector(String.fromCharCode(35) + "cT span[data-in]")?.textContent ?? "");
    scrollTo(0, 0); await sleep(200);
    return { before, after };
  })()`));
  check("I3 гүйлтийн үед дугуй тавиурыг эргүүлэхгүй", wheel != null && wheel.before === wheel.after, `${wheel ? `"${wheel.before}" → "${wheel.after}"` : "гүйцээгүй"}`);

  // I2 — хөрш ном дээр дарвал урагш эргэнэ
  const neighbour = await guard("I2 хөрш ном", () => page.evaluate(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    scrollTo(0, 0); await sleep(300);
    const before = (document.querySelector(String.fromCharCode(35) + "cT span[data-in]")?.textContent ?? "");
    const tapes = [...document.querySelectorAll(".tape")].filter(t => t.style.display !== "none");
    const mid = tapes[Math.floor(tapes.length / 2)];
    const neighbours = tapes.filter(t => t !== mid);
    const target = neighbours[Math.floor(neighbours.length / 2)] || neighbours[0];
    target.querySelector(".sp")?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await sleep(1400);
    return { before, after: (document.querySelector(String.fromCharCode(35) + "cT span[data-in]")?.textContent ?? "") };
  })()`));
  check("I2 хөрш ном дээр дарвал солигдоно", neighbour != null && neighbour.before !== neighbour.after, `${neighbour ? `"${neighbour.before}" хэвээр` : "гүйцээгүй"}`);

  // I5 — стори солигдоход фокус давхаргаас гарах ёсгүй
  const focus = await guard("I5 фокус", () => page.evaluate(`(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const first = document.querySelector('.st[data-sk="0"]');
    if (!first) return { skipped: true };
    first.click();
    await sleep(400);
    const inside = () => document.getElementById("svb")?.contains(document.activeElement) ?? false;
    const atOpen = inside();
    document.getElementById("svr")?.click();
    await sleep(250);
    const afterStep = inside();
    dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(300);
    return { skipped: false, atOpen, afterStep, closed: document.getElementById("sv").hasAttribute("hidden") };
  })()`));
  if (focus == null) {
    /* guard аль хэдийн бүртгэсэн */
  } else if (focus.skipped) {
    pass.push("I5 стори байхгүй — алгасав");
  } else {
    check("I5 нээхэд фокус давхарга дотор", focus.atOpen, "фокус гадна");
    check("I5 стори солиход фокус үлдэнэ", focus.afterStep, "фокус давхаргаас үсэрсэн");
    check("I5 Escape хаана", focus.closed, "хаагдаагүй");
  }

  // ---- Нийтлэлийн хуудас -------------------------------------------------
  const slug = await page.evaluate(
    `document.querySelector('#fList a.fi')?.getAttribute('href')?.replace('/news/','') || ''`,
  );
  if (slug) {
    await page.goto("/news/" + slug);
    const article = await page.evaluate(`(() => {
      const el = document.querySelector("main p") || document.querySelector("main");
      return { select: getComputedStyle(el).userSelect, cursor: getComputedStyle(document.body).cursor };
    })()`);
    check("C2 нийтлэлийн текст сонгогдоно", article.select !== "none", `user-select: ${article.select}`);
    check("C1 нийтлэл дээр курсортой", article.cursor !== "none", `cursor: ${article.cursor}`);
  }

  // ---- Утас --------------------------------------------------------------
  await page.goto("/", { width: 390, height: 844 });
  const phone = await page.evaluate(
    `({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth })`,
  );
  check("Утсан дээр хэвтээ халилтгүй", phone.overflow === 0, `халилт ${phone.overflow}px`);
} finally {
  page.close();
}

for (const name of pass) console.log("  ok   " + name);
for (const f of failures) console.error("  FAIL " + f);
console.log(`\n${pass.length} ok, ${failures.length} fail`);
process.exit(failures.length === 0 ? 0 : 1);
