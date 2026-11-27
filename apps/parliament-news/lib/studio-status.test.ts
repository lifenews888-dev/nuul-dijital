import { describe, it, expect } from "vitest";
import type { NewsStatus } from "@nuul/db-news";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { STATUS_LABELS, STATUS_ORDER, mnAgoShort, postBadge } from "./studio-status";

/**
 * Төлөвийн монгол шошго — `admin.html:840`-ийн `STS`.
 * Эдгээр үг редакцын хэлний нэг хэсэг: «Хянагдаж буй» гэдгийг
 * «Хянагдаж байгаа» болгоход бүх дасгалжсан нүд гацна.
 */
describe("STATUS_LABELS", () => {
  it("artifact-ийн STS хүснэгт", () => {
    expect(STATUS_LABELS).toEqual({
      DRAFT: "Ноорог",
      REVIEW: "Хянагдаж буй",
      APPROVED: "Батлагдсан",
      RETURNED: "Буцаасан",
      PUBLISHED: "Нийтлэгдсэн",
    });
  });
});

describe("STATUS_ORDER", () => {
  it("урсгалын дараалал, буцаасан нь төгсгөлд", () => {
    expect(STATUS_ORDER).toEqual(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "RETURNED"]);
  });

  it("таван төлөв бүгд", () => {
    expect(new Set(STATUS_ORDER).size).toBe(5);
  });
});

/**
 * Чипийн өнгө нь CSS-д, `[data-status]`-аар. React-ийн `style` нь объект
 * шаарддаг тул `color-mix(...)` гэсэн мөрийг тэнд тавьж болохгүй; мөн
 * өнгө нь CSS-д байвал бараан горим нь токенуудаар дагана.
 *
 * Энэ тест нь таван дүрэм БҮГД байгааг барина: нэг нь дутвал тэр төлөв
 * чипгүй, өнгөгүй, зүгээр текст болж, редактор «ямар төлөвтэй вэ» гэдгийг
 * жагсаалтаас уншиж чадахгүй.
 */
describe("app/studio.css", () => {
  const app = dirname(dirname(fileURLToPath(import.meta.url)));
  const css = readFileSync(join(app, "app/studio.css"), "utf8");

  it("төлөв бүрт чипийн дүрэм", () => {
    for (const status of STATUS_ORDER) {
      expect(css).toContain(`[data-status="${status}"]`);
    }
  });

  /** «Цаг товлосон» нь төлөв биш ч чипийн дүрэм хэрэгтэй */
  it("цаг товлосонд ч дүрэм", () => {
    expect(css).toContain('[data-status="SCHEDULED"]');
  });

  it("өнгийг admin.html шиг color-mix-ээр бүдэгрүүлнэ", () => {
    expect(css).toContain("color-mix(in srgb");
  });

  it("нийтлэгдсэн нь --ok, буцаасан нь улаан", () => {
    const published = css.slice(css.indexOf('[data-status="PUBLISHED"]'));
    expect(published.slice(0, 160)).toContain("--ok");
    const returned = css.slice(css.indexOf('[data-status="RETURNED"]'));
    expect(returned.slice(0, 160)).toContain("#c0392b");
  });
});

/**
 * `admin.html`-ийн `ago()` — «дөнгөж сая», «12 мин өмнө», «3 цагийн өмнө»,
 * «2 өдрийн өмнө». Жагсаалтад хэзээ хөдөлснийг харуулахад.
 */
describe("mnAgoShort", () => {
  const now = new Date("2026-11-27T12:00:00Z");
  const ago = (ms: number) => mnAgoShort(new Date(now.getTime() - ms), now);

  /** admin.html нь `Math.round` хэрэглэдэг тул хил нь 30 секунд, 60 биш */
  it("хагас минутын дотор", () => {
    expect(ago(0)).toBe("дөнгөж сая");
    expect(ago(29_000)).toBe("дөнгөж сая");
    expect(ago(31_000)).toBe("1 мин өмнө");
  });

  it("минутаар", () => {
    expect(ago(12 * 60_000)).toBe("12 мин өмнө");
    expect(ago(59 * 60_000)).toBe("59 мин өмнө");
  });

  it("цагаар", () => {
    expect(ago(3 * 3_600_000)).toBe("3 цагийн өмнө");
  });

  it("өдрөөр", () => {
    expect(ago(2 * 86_400_000)).toBe("2 өдрийн өмнө");
  });

  /** Цаг зөрүүгээс болж ирээдүйн огноо ирвэл сөрөг тоо хэвлэхгүй */
  it("ирээдүйн огнооноос сөрөг тоо гаргахгүй", () => {
    expect(mnAgoShort(new Date(now.getTime() + 60_000), now)).toBe("дөнгөж сая");
  });
});

/**
 * Жагсаалтын шошго нь «САЙТАД БАЙГАА ЭСЭХ»-ийг хэлэх ёстой, зөвхөн
 * өгөгдлийн сангийн төлөвийг биш.
 *
 * Нийтийн шүүлт нь `status = PUBLISHED AND publishedAt <= now`
 * (`lib/posts.ts`-ийн `publishedWhere`). Иймд ирээдүйн `publishedAt`-тай
 * мэдээ нь төлөвөөрөө «Нийтлэгдсэн» атлаа сайт дээр БАЙХГҮЙ. Шошго нь
 * «Нийтлэгдсэн» гэж хэлбэл редактор мэдээгээ гарсан гэж бодож, уншигч
 * олохгүй — бодит байдал дээр яг тэр тохиолдсон (демо өгөгдлийн
 * «ЦАГ ТОВЛОСОН» мэдээ).
 */
describe("postBadge", () => {
  const now = new Date("2026-11-27T12:00:00Z");
  const at = (offsetMs: number) => new Date(now.getTime() + offsetMs);

  it("нийтлэгдсэн ба хугацаа нь болсон бол «Нийтлэгдсэн»", () => {
    expect(postBadge({ status: "PUBLISHED", publishedAt: at(-1000) }, now)).toEqual({
      kind: "PUBLISHED",
      label: "Нийтлэгдсэн",
    });
  });

  it("ирээдүйн огноотой бол «Цаг товлосон»", () => {
    expect(postBadge({ status: "PUBLISHED", publishedAt: at(86_400_000) }, now)).toEqual({
      kind: "SCHEDULED",
      label: "Цаг товлосон",
    });
  });

  /** Огноогүй «нийтлэгдсэн» ч сайтад гарахгүй — publishedWhere нь `not: null` */
  it("огноогүй бол ч сайтад байхгүй гэдгийг хэлнэ", () => {
    expect(postBadge({ status: "PUBLISHED", publishedAt: null }, now).kind).toBe("SCHEDULED");
  });

  it("яг одоо бол нийтлэгдсэн", () => {
    expect(postBadge({ status: "PUBLISHED", publishedAt: now }, now).kind).toBe("PUBLISHED");
  });

  it("бусад төлөв өөрийн шошготой хэвээр", () => {
    for (const status of ["DRAFT", "REVIEW", "APPROVED", "RETURNED"] as const) {
      expect(postBadge({ status, publishedAt: null }, now)).toEqual({
        kind: status,
        label: STATUS_LABELS[status],
      });
    }
  });

  /** Ноорог дээр ирээдүйн огноо байлаа ч тэр нь ноорог хэвээр */
  it("ноорогт ирээдүйн огноо байсан ч ноорог", () => {
    expect(postBadge({ status: "DRAFT", publishedAt: at(86_400_000) }, now).kind).toBe("DRAFT");
  });
});
