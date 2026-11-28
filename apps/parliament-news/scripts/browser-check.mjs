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
    async goto(path, { width = 1280, height = 900, reduced = false, scheme = "dark" } = {}) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 500,
      });
      await send("Emulation.setEmulatedMedia", {
        features: [
          { name: "prefers-color-scheme", value: scheme },
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

/**
 * `rgb(…)` мөрийн гэрэлтүүлэг 0..1. ЗӨВХӨН Node талд: хуудсан доторх
 * илэрхийлэл нь template literal-ийн ДОТОР template literal болдог тул
 * регексийн `\d` хоёр удаа задарч, бодитоор `d` болж хувирдаг (ингээд
 * шалгуур чимээгүй үргэлж ногоон болсон). Мөрийг нь гаргаж аваад энд
 * задлах нь тэр ангалыг бүрмөсөн арилгана.
 */
function luminance(css) {
  const n = String(css).match(/\d+(\.\d+)?/g);
  if (!n || n.length < 3) return null;
  const [r, g, b] = n.map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
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

  // ---- Цэс ба хайлт ------------------------------------------------------
  /*
   * M1-M7: цэс нь НЭЭМЭГЦ илэрцтэй байх ёстой.
   *
   * Эхний хувилбар нь бичих хүртэл хоосон байв — хэрэглэгч нүдээрээ
   * олсон. Artifact-ийн `openMenu()` нь харуулахаасаа ӨМНӨ `renderRes()`
   * дууддаг: цэс нь хэзээ ч хоосон байдаггүй. Цэвэр тест нь
   * `lib/menu-filter.ts`-ийг барина; ЭНЭ нь тэр логик хуудастай
   * холбогдсон эсэхийг барина.
   */
  await page.goto("/");

  const menu = await guard("M цэс", async () => {
    await page.evaluate(`document.getElementById('burger').click()`);
    await new Promise((r) => setTimeout(r, 500));
    return page.evaluate(`(() => {
      const res = document.querySelectorAll('#res .ri').length;
      return {
        open: !document.getElementById('menu').hidden,
        results: res,
        covers: document.querySelectorAll('#res .rcv img').length,
        chips: document.querySelectorAll('#chips .chip').length,
        chipIcons: document.querySelectorAll('#chips .chip svg').length,
        chipCount: document.querySelector('#chips .chip small')?.textContent || '',
        rc: document.getElementById('rc')?.textContent || '',
        times: document.querySelectorAll('#tflt button').length,
      };
    })()`);
  });

  check("M1 бургер цэсийг нээнэ", menu?.open === true, `hidden: ${!menu?.open}`);
  check("M2 нээмэгц илэрц харагдана", (menu?.results ?? 0) > 0, `${menu?.results} илэрц`);
  check("M3 илэрц хавтастай", (menu?.covers ?? 0) > 0, `${menu?.covers} хавтас`);
  check("M4 чип дүрс, тоотой", (menu?.chipIcons ?? 0) > 0 && /\d+ мэдээ/.test(menu?.chipCount || ""), `${menu?.chipIcons} дүрс, «${menu?.chipCount}»`);
  check("M5 хугацааны шүүлтүүр", (menu?.times ?? 0) === 4, `${menu?.times} товч`);
  check("M6 илэрцийн тоолуур", /\d+ мэдээ/.test(menu?.rc || ""), `«${menu?.rc}»`);

  // Бичихэд шүүгдэх ба архиваас хайх санал
  const typed = await guard("M7 хайлт", async () => {
    await page.evaluate(`(() => {
      const i = document.getElementById('q');
      const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      set.call(i, 'zzzqqqxxx');
      i.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 400));
    return page.evaluate(`({
      empty: !!document.querySelector('#res .empty'),
      more: !!document.querySelector('a[href^="/search?q="]'),
    })`);
  });

  check("M7 илэрцгүйд хоосон төлөв", typed?.empty === true, "«Илэрц олдсонгүй» алга");
  /*
   * Цэс нь зөвхөн сүүлийн 60 мэдээг татдаг. «Илэрц олдсонгүй» гэдэг нь
   * «сайтад байхгүй» гэсэн үг БИШ — архиваас хайх санал ҮРГЭЛЖ үлдэх
   * ёстой, эс бөгөөс цэс нь уншигчид худал хэлнэ.
   */
  check("M8 илэрцгүй ч архиваас хайх санал", typed?.more === true, "/search холбоос алга");

  await guard("M цэс хаах", () => page.evaluate(
    `document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`,
  ));
  await new Promise((r) => setTimeout(r, 300));

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

  // ---- Студи нь хаалгатай ------------------------------------------------
  /*
   * E1-E2: засварлагчийн замууд нэвтрээгүй хүнд НЭЭГДЭХГҮЙ.
   *
   * Формын өөрийн зан төлөв (талбар дүүрэх, хавтас шинэчлэгдэх,
   * хадгалах) нь жинхэнэ сесс шаарддаг тул энд биш — тэр нь
   * редакцын гишүүнээр нэвтэрч шалгадаг тусдаа скриптэд.
   */
  // ---- Баян текст --------------------------------------------------------
  /*
   * B1-B4: `lib/rich-text.ts`-ийн блокууд хуудсанд ҮНЭХЭЭР элемент болж
   * байгаа эсэх. Цэвэр тест нь задлагчийг барина; энэ нь дүрслэлийг.
   *
   * B4 нь хамгийн чухал: редакцын бичсэн `<script>` нь ХЭЗЭЭ Ч таг болж
   * болохгүй. `dangerouslySetInnerHTML` ашиглаагүй тул боломжгүй, гэхдээ
   * хэн нэг нь хожим «хурдан» гэж түүнийг буцааж тавих магадлалтай.
   */
  const rich = await guard("B баян текст", async () => {
    const href = await page.evaluate(
      `document.querySelector('a[href^="/news/"]')?.getAttribute('href') || ''`,
    );
    if (!href) return { skipped: true };
    await page.goto(href);
    return page.evaluate(`(() => {
      const body = document.querySelector('.dbody');
      return {
        has: !!body,
        h3: document.querySelectorAll('.dbody h3').length,
        quote: document.querySelectorAll('.dbody blockquote').length,
        pull: document.querySelectorAll('.dbody blockquote.pq').length,
        list: document.querySelectorAll('.dbody ul li').length,
        embeds: document.querySelectorAll('.dbody .emb iframe').length,
        badFrames: [...document.querySelectorAll('.dbody iframe')].filter(
          (f) => !/^https:\/\/(www\.youtube\.com|platform\.twitter\.com|www\.facebook\.com)\//.test(f.src),
        ).length,
        scripts: document.querySelectorAll('.dbody script').length,
        markup: (body?.textContent || '').includes('##'),
      };
    })()`);
  });

  if (!rich || rich.skipped) {
    pass.push("B мэдээ байхгүй — алгасав");
  } else {
    check("B1 биет бүтэцлэгдсэн блокоор зурагдана", rich.has === true, "`.dbody` алга");
    check(
      "B2 тэмдэглэгээ ТҮҮХИЙ үлдээгүй",
      rich.markup === false,
      "«##» уншигчид харагдаж байна",
    );
    check("B3 шигтгээ зөвхөн зөвшөөрөгдсөн хостоос", rich.badFrames === 0, `${rich.badFrames} танихгүй iframe`);
    check("B4 биетэд script таг үүсдэггүй", rich.scripts === 0, `${rich.scripts} script`);
  }

  // ---- Цаг агаар ба ханш -------------------------------------------------
  /*
   * W1-W3: тохиргооны цаг агаар, ханш нь НИЙТИЙН талд гарч байгаа эсэх.
   *
   * Гурван харагдац нэг өгөгдлөөс: гүйдэг мөрийн `.tinfo`, цэсний `.minfo`,
   * утасны `.minfo2`. Цэвэр тест нь `lib/info.ts`-ийн шүүлт, бөөрөнхийлөлтийг
   * барина; ЭНЭ нь тэдгээр нь хуудсанд үнэхээр холбогдсон эсэхийг барина.
   *
   * Өгөгдөл байхгүй бол алгасана: редакц ханш оруулаагүй байх нь хэвийн, ба
   * тэр үед БҮХ блок алга болох ёстой — түүнийг нь мөн шалгана.
   */
  await page.goto("/");
  const info = await guard("W мэдээлэл", async () =>
    page.evaluate(`(() => {
      const burger = document.getElementById('burger');
      burger && burger.click();
      return new Promise((done) => setTimeout(() => done({
        ticker: (document.querySelector('.tinfo')?.textContent || '').trim(),
        menu: (document.querySelector('.minfo')?.textContent || '').trim(),
        strip: (document.querySelector('.minfo2')?.textContent || '').trim(),
        stripHidden: document.querySelector('.minfo2')
          ? getComputedStyle(document.querySelector('.minfo2')).display === 'none'
          : null,
        arrows: document.querySelectorAll('.minfo .up, .minfo .dn').length,
        src: (document.querySelector('.isrc')?.textContent || '').trim(),
      }), 600));
    })()`),
  );

  if (!info || (!info.ticker && !info.menu)) {
    pass.push("W цаг агаар, ханш оруулаагүй — алгасав");
  } else {
    check("W1 гүйдэг мөрөнд ханш гарна", /\d/.test(info.ticker), `«${info.ticker.slice(0, 40)}»`);
    check(
      "W2 цэсний ӨНӨӨДӨР блок",
      info.menu.includes("ӨНӨӨДӨР") && /\d/.test(info.menu),
      `«${info.menu.slice(0, 40)}»`,
    );
    check("W3 ханшийн эх сурвалж нэрлэгдэнэ", /Ханш:/.test(info.src), `«${info.src}»`);
    /*
     * `.minfo2` нь ширээн дээр нуугдах ёстой: гүйдэг мөр аль хэдийн
     * харуулж байгаа тул хоёр удаа гарвал цэс давхардсан харагдана.
     */
    check("W4 утасны зурвас ширээн дээр нуугдана", info.stripHidden !== false, "харагдаж байна");
  }

  // ---- Нийтлэлийн унших харагдац -----------------------------------------
  /*
   * R1-R6: artifact-ийн нийтлэлийн дэлгэц нь ЦААСАН ХУУДАС дээр суудаг ба
   * хуулийн шат, үсгийн хэмжээ, санал болгох мэдээ нь ҮЙЛДЭЛТЭЙ. Цэвэр
   * тест нь `lib/reading.ts`-ийн дүрмийг барина; ЭНЭ нь тэр дүрэм хуудсанд
   * үнэхээр холбогдсон эсэхийг барина.
   *
   * R6 нь бодитоор гарсан алдаанаас: artifact-д ГАНЦ хуудас байсан тул
   * `.top{color:#fff}` болзолгүй бөгөөд тавиургүй хуудсанд цэс нь цайвар
   * цаасан дээр цагаанаар бичигдэж, огт үл үзэгдэх болсон.
   */
  await page.goto("/");
  const firstNews = await page.evaluate(
    `document.querySelector('a[href^="/news/"]')?.getAttribute('href') || ''`,
  );

  if (!firstNews) {
    pass.push("R нийтлэл байхгүй — алгасав");
  } else {
    const read = await guard("R унших харагдац", async () => {
      await page.goto(firstNews);
      return page.evaluate(`(() => {
        const trk = document.querySelectorAll('.trk button');
        return {
          sheet: !!document.querySelector('.spread .pg.L'),
          lede: !!document.querySelector('.dlede, .dbody'),
          stages: trk.length,
          current: document.querySelectorAll('.trk button.cu').length,
          panel: (document.querySelector('.stgp')?.textContent || '').trim().slice(0, 40),
          nextLinks: document.querySelectorAll('.nx a[href^="/news/"]').length,
          comments: !!document.querySelector('.cm'),
          fz: getComputedStyle(document.querySelector('.spread')).getPropertyValue('--fz').trim(),
        };
      })()`);
    });

    if (read) {
      check("R1 нийтлэл цаасан хуудсан дээр", read.sheet && read.lede, JSON.stringify(read.sheet));
      check(
        "R2 хуулийн шат — 5 нүд, одоогийнх тэмдэглэгдсэн",
        read.stages === 0 || (read.stages === 5 && read.current === 1),
        `${read.stages} нүд, ${read.current} одоогийн`,
      );
      check("R4 дараагийн ба санал болгох мэдээ холбоостой", read.nextLinks > 0, `${read.nextLinks} холбоос`);
      check("R5 сэтгэгдлийн блок", read.comments === true, "блок алга");
      /*
       * Ялгаралтыг ХОЁР горимд. Эхний хувилбар нь зөвхөн бараанд шалгаж,
       * алдааг БАРИАГҮЙ: цэс нь бараан дэвсгэр дээр цагаанаар зөв гардаг,
       * харин цайвар цаасан дээр мөн цагаанаар гарч алга болдог байв.
       */
      for (const scheme of ["dark", "light"]) {
        const probe = await guard(`R6 ${scheme}`, async () => {
          await page.goto(firstNews, { scheme });
          return page.evaluate(`(() => {
            const a = document.querySelector('.top .navc a');
            return {
              nav: a ? getComputedStyle(a).color : null,
              bg: getComputedStyle(document.body).backgroundColor,
            };
          })()`);
        });
        if (probe) {
          const navLum = luminance(probe.nav);
          const bgLum = luminance(probe.bg);
          check(
            `R6 толгойн цэс ялгарна (${scheme})`,
            navLum === null || bgLum === null || Math.abs(navLum - bgLum) > 0.25,
            `цэс ${probe.nav} vs дэвсгэр ${probe.bg}`,
          );
        }
      }
      await page.goto(firstNews);

      // R3: шат дээр дарвал самбар солигдоно; A+ дарвал үсэг томорно
      const acted = await guard("R3 үйлдэл", async () =>
        page.evaluate(`(async () => {
          const before = (document.querySelector('.stgp')?.textContent || '').trim().slice(0, 40);
          const last = [...document.querySelectorAll('.trk button')].pop();
          last && last.click();
          const fz0 = getComputedStyle(document.querySelector('.spread')).getPropertyValue('--fz').trim();
          document.querySelectorAll('.fzg button')[1]?.click();
          await new Promise((r) => setTimeout(r, 200));
          return {
            changed: (document.querySelector('.stgp')?.textContent || '').trim().slice(0, 40) !== before,
            fz0,
            fz1: getComputedStyle(document.querySelector('.spread')).getPropertyValue('--fz').trim(),
          };
        })()`),
      );
      if (acted) {
        check("R3 шат дээр дарвал тайлбар солигдоно", read.stages === 0 || acted.changed, "өөрчлөгдөөгүй");
        check(
          "R3 A+ үсгийг томруулна",
          Number(acted.fz1 || 1) > Number(acted.fz0 || 1),
          `${acted.fz0} → ${acted.fz1}`,
        );
      }
    }
  }

  // ---- Хавтасны хэвлэмэл бүтэц ------------------------------------------
  /*
   * T1-T3: `lib/cover.ts`-ийн `textureLayer()` нь ҮНЭХЭЭР зурагддаг ба
   * брэндийн өнгийг ҮЛ ГАЖУУДУУЛНА.
   *
   * Яагаад хөтчөөр: эхний хувилбар нь бараан үр тариаг `multiply`-аар,
   * цайварыг `screen`-ээр тавьсан — vitest бүгд ногоон байсан (мөр нь
   * зөв), харин зурагдахдаа #0A22E0 хөх бүдгэрч, #F3F0EA цаас саарал
   * болсон. Цэвэр функцийн тест үүнийг хэзээ ч барихгүй: энэ нь ПИКСЕЛИЙН
   * шинж. Тиймээс хавтсыг canvas-д зурж, бүтэцтэй/бүтэцгүй хоёрыг
   * харьцуулна — палитрыг энд давтахгүй, хавтас өөрөө эталоноо авчирна.
   */
  await page.goto("/");

  const tex = await guard("T хавтасны бүтэц", async () =>
    page.evaluate(`(async () => {
      const src = document.querySelector('.tape .cv img')?.getAttribute('src');
      if (!src) return { skipped: true };
      const svg = await (await fetch(src)).text();
      if (!svg.includes('feTurbulence')) return { missing: true };
      const cut = svg.lastIndexOf('<g pointer-events="none">');
      const bare = cut < 0 ? svg : svg.slice(0, cut) + '</svg>';

      const draw = (text) => new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = 474; c.height = 900;
          const x = c.getContext('2d');
          x.drawImage(img, 0, 0, 474, 900);
          // Гарчиг, хээнээс ЧӨЛӨӨТЭЙ хэсэг: баруун дээд булангийн доод тал
          res(x.getImageData(300, 100, 120, 24).data);
        };
        img.onerror = () => rej(new Error('зурагдсангүй'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
      });

      const stat = (d) => {
        let n = 0, s = [0, 0, 0], q = 0;
        for (let i = 0; i < d.length; i += 4) {
          n++; s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2];
        }
        const m = s.map((v) => v / n);
        for (let i = 0; i < d.length; i += 4) {
          const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
          q += (l - (m[0] + m[1] + m[2]) / 3) ** 2;
        }
        return { mean: m, sd: Math.sqrt(q / n), sat: Math.max(...m) - Math.min(...m) };
      };

      const a = stat(await draw(bare));
      const b = stat(await draw(svg));
      return {
        drift: Math.max(...a.mean.map((v, i) => Math.abs(v - b.mean[i]))),
        satLoss: a.sat - b.sat,
        sdGain: b.sd - a.sd,
      };
    })()`),
  );

  if (tex?.skipped) {
    pass.push("T хавтас байхгүй — алгасав");
  } else if (tex?.missing) {
    check("T1 хавтсанд бүтэц байна", false, "feTurbulence олдсонгүй");
  } else if (tex) {
    check("T1 бүтэц үнэхээр зурагдана", tex.sdGain > 0.8, `барзгар ${tex.sdGain.toFixed(2)}`);
    check("T2 брэндийн өнгө шилжихгүй", tex.drift < 14, `шилжилт ${tex.drift.toFixed(1)}/255`);
    check("T3 өнгө ханамж алдагдахгүй", tex.satLoss < 14, `ханамж -${tex.satLoss.toFixed(1)}`);
  }

  for (const [name, path] of [
    ["E1 шинэ мэдээ хаалгатай", "/studio/news/new"],
    ["E2 засварлагч хаалгатай", "/studio/news/some-id"],
  ]) {
    const landed = await guard(name, async () => {
      await page.goto(path);
      return page.evaluate(`location.pathname`);
    });
    check(name, landed === "/studio/signin", `буусан зам: ${landed}`);
  }

  // Нийтийн нүүрэнд буцаж ирэх — доорх утасны шалгуур түүнээс хамаарна
  await page.goto("/");

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
