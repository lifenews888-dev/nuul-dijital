"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc, trpcMessage } from "../../../lib/trpc-client";
import { SEATS, SESSION_STATUSES } from "../../../lib/live-input";
import type { SettingsData } from "../../../lib/studio-admin";
import { Panel, adminInput, adminButton, adminPrimary } from "./panel";

/**
 * Сайтын тохиргоо — admin.html-ийн `v-set`-ийн 14 самбар.
 *
 * Самбар бүр ӨӨРИЙН хадгалах товчтой: бүгдийг нэг товчоор хадгалбал
 * ирц засах гэж орсон хүн санамсаргүйгээр толгойн лого, хөлний
 * холбоосыг хамт бичнэ.
 */
type Row = Record<string, unknown>;

function useSave() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    setDone(null);
    try {
      await fn();
      setDone(key);
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return { busy, done, error, save };
}

function SaveBar({
  k,
  busy,
  done,
  onSave,
}: {
  k: string;
  busy: string | null;
  done: string | null;
  onSave: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <button type="button" className={adminPrimary} disabled={busy === k} onClick={onSave}>
        {busy === k ? "Хадгалж байна…" : "Хадгалах"}
      </button>
      {done === k ? (
        <span className="font-head text-[12.5px] font-semibold text-ok">Хадгаллаа</span>
      ) : null}
    </div>
  );
}

export function SettingsForm({ data }: { data: SettingsData }) {
  const { busy, done, error, save } = useSave();

  const [live, setLive] = useState(data.live);
  const [agenda, setAgenda] = useState<{ time: string; text: string }[]>(
    data.agenda.length ? data.agenda : [{ time: "10:00", text: "" }],
  );
  const [ticker, setTicker] = useState(data.ticker);
  const [fx, setFx] = useState(data.fx);
  const [rates, setRates] = useState(data.rates);
  const [cats, setCats] = useState(data.categories);

  const wx = (data.weather ?? {}) as Row;
  const [weather, setWeather] = useState({
    city: String(wx.city ?? "Улаанбаатар"),
    t: typeof wx.t === "number" ? wx.t : 0,
    i: String(wx.i ?? "sun"),
    txt: String(wx.txt ?? ""),
  });

  const hd = (data.header ?? {}) as Row;
  const ft = (data.footer ?? {}) as Row;
  const fd = (data.feed ?? {}) as Row;
  const [header, setHeader] = useState({ tagline: String(hd.tagline ?? "") });
  const [footer, setFooter] = useState({
    about: String(ft.about ?? ""),
    email: String(ft.email ?? ""),
    phone: String(ft.phone ?? ""),
  });
  const [feed, setFeed] = useState({ rss: fd.rss !== false });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      {error ? (
        <p role="alert" className="mb-3 font-head text-[13px] font-semibold text-[#c0392b]">
          {error}
        </p>
      ) : null}

      {/* 1 — Нэгдсэн хуралдаан */}
      <Panel title="Нэгдсэн хуралдаан" hint="Нүүрний хагас дугуй 126 суудлыг зурна.">
        <label className="mb-3 block">
          <span className="mb-1.5 flex items-baseline gap-2 font-head text-[13px] font-semibold text-muted">
            Ирц
            <em className="not-italic tabular-nums text-ink">{`${live.attendance} / ${SEATS}`}</em>
          </span>
          <input
            type="range"
            min={0}
            max={SEATS}
            value={live.attendance}
            onChange={(e) => setLive({ ...live, attendance: Number(e.target.value) })}
            className="w-full max-w-[420px]"
          />
        </label>

        <label className="mb-3 block max-w-[280px]">
          <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">Төлөв</span>
          <select
            className={adminInput}
            value={live.sessionStatus}
            onChange={(e) => setLive({ ...live, sessionStatus: e.target.value })}
          >
            {SESSION_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <SaveBar
          k="live"
          busy={busy}
          done={done}
          onSave={() => void save("live", () => trpc.studioAdmin.live.mutate(toLiveInput(live)))}
        />
      </Panel>

      {/* 2 — Өнөөдөр хэлэлцэх асуудал */}
      <Panel title="Өнөөдөр хэлэлцэх асуудал" hint="Нүүрний «Өнөөдөр» виджетэд гарна.">
        {agenda.map((row, i) => (
          <div key={i} className="mb-2 grid grid-cols-[88px_minmax(0,1fr)_40px] gap-2">
            <input
              className={adminInput}
              value={row.time}
              placeholder="10:00"
              onChange={(e) =>
                setAgenda(agenda.map((r, k) => (k === i ? { ...r, time: e.target.value } : r)))
              }
            />
            <input
              className={adminInput}
              value={row.text}
              placeholder="Төсвийн тухай хуулийн төслийн хэлэлцүүлэг"
              onChange={(e) =>
                setAgenda(agenda.map((r, k) => (k === i ? { ...r, text: e.target.value } : r)))
              }
            />
            <button
              type="button"
              className={adminButton}
              onClick={() => setAgenda(agenda.filter((_, k) => k !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className={adminButton}
          disabled={agenda.length >= 12}
          onClick={() => setAgenda([...agenda, { time: "", text: "" }])}
        >
          ＋ Мөр нэмэх
        </button>
        <SaveBar
          k="agenda"
          busy={busy}
          done={done}
          onSave={() =>
            void save("agenda", () =>
              trpc.studioAdmin.agenda.mutate({
                date: today,
                rows: agenda.filter((r) => r.time.trim() && r.text.trim()),
              }),
            )
          }
        />
      </Panel>

      {/* 3 — Шууд дамжуулалт ба яаралтай мэдээ */}
      <Panel
        title="Шууд дамжуулалт ба яаралтай мэдээ"
        hint="Асаавал сайтын бүх хуудасны дээд талд улаан мөр гарна."
      >
        <label className="mb-2 flex items-center gap-2 font-head text-sm text-ink">
          <input
            type="checkbox"
            checked={live.liveOn}
            onChange={(e) => setLive({ ...live, liveOn: e.target.checked })}
          />
          «ШУУД» мөр харуулах
        </label>
        <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            className={adminInput}
            value={live.liveTitle ?? ""}
            placeholder="Нэгдсэн хуралдаан"
            onChange={(e) => setLive({ ...live, liveTitle: e.target.value })}
          />
          <input
            className={adminInput}
            dir="ltr"
            value={live.liveUrl ?? ""}
            placeholder="https://"
            onChange={(e) => setLive({ ...live, liveUrl: e.target.value })}
          />
        </div>

        <label className="mb-2 flex items-center gap-2 font-head text-sm text-ink">
          <input
            type="checkbox"
            checked={live.breakingOn}
            onChange={(e) => setLive({ ...live, breakingOn: e.target.checked })}
          />
          Яаралтай мэдээний мөр харуулах
        </label>
        <input
          className={`${adminInput} mb-2`}
          maxLength={140}
          value={live.breakingText ?? ""}
          placeholder="Нэгдсэн хуралдаан 2027 оны төсвийг баталлаа"
          onChange={(e) => setLive({ ...live, breakingText: e.target.value })}
        />
        <label className="mb-1 block max-w-[420px]">
          <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">
            Дарахад нээгдэх мэдээ <em className="not-italic">зөвхөн нийтлэгдсэн</em>
          </span>
          <select
            className={adminInput}
            value={live.breakingPostId ?? ""}
            onChange={(e) => setLive({ ...live, breakingPostId: e.target.value || null })}
          >
            <option value="">— Сонгоогүй —</option>
            {data.recent.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-2 flex items-center gap-2 font-head text-sm text-ink">
          <input
            type="checkbox"
            checked={live.tickerOn}
            onChange={(e) => setLive({ ...live, tickerOn: e.target.checked })}
          />
          Нүүрэнд гүйдэг мөр харуулах
        </label>

        <SaveBar
          k="live2"
          busy={busy}
          done={done}
          onSave={() => void save("live2", () => trpc.studioAdmin.live.mutate(toLiveInput(live)))}
        />
      </Panel>

      {/* 4 — Урсдаг мөрийн зар */}
      <Panel title="Урсдаг мөрийн зар" hint="«ШУУД» мөрөнд 3 мэдээ тутамд «ЗАР» шошготой гарна.">
        {ticker.map((row, i) => (
          <div key={i} className="mb-2 grid grid-cols-[minmax(0,1fr)_160px_auto_40px] gap-2">
            <input
              className={adminInput}
              value={row.text}
              placeholder="Зарын текст"
              onChange={(e) =>
                setTicker(ticker.map((r, k) => (k === i ? { ...r, text: e.target.value } : r)))
              }
            />
            <input
              className={adminInput}
              dir="ltr"
              value={row.url ?? ""}
              placeholder="https://"
              onChange={(e) =>
                setTicker(ticker.map((r, k) => (k === i ? { ...r, url: e.target.value } : r)))
              }
            />
            <label className="flex items-center gap-1.5 font-head text-[12.5px] text-muted">
              <input
                type="checkbox"
                checked={row.active}
                onChange={(e) =>
                  setTicker(
                    ticker.map((r, k) => (k === i ? { ...r, active: e.target.checked } : r)),
                  )
                }
              />
              идэвхтэй
            </label>
            <button
              type="button"
              className={adminButton}
              onClick={() => setTicker(ticker.filter((_, k) => k !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className={adminButton}
          onClick={() =>
            setTicker([...ticker, { id: "", text: "", url: "", active: true }])
          }
        >
          ＋ Зар нэмэх
        </button>
        <SaveBar
          k="ticker"
          busy={busy}
          done={done}
          onSave={() =>
            void save("ticker", () =>
              trpc.studioAdmin.ticker.mutate({
                rows: ticker
                  .filter((r) => r.text.trim())
                  .map((r) => ({ text: r.text, url: r.url || undefined, active: r.active })),
              }),
            )
          }
        />
      </Panel>

      {/* 5 — Цаг агаар */}
      <Panel title="Цаг агаар" hint="Гүйдэг мөр ба цэсний «ӨНӨӨДӨР» блокт гарна.">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input
            className={adminInput}
            value={weather.city}
            placeholder="Улаанбаатар"
            onChange={(e) => setWeather({ ...weather, city: e.target.value })}
          />
          <input
            className={adminInput}
            type="number"
            value={weather.t}
            onChange={(e) => setWeather({ ...weather, t: Number(e.target.value) })}
          />
          <select
            className={adminInput}
            value={weather.i}
            onChange={(e) => setWeather({ ...weather, i: e.target.value })}
          >
            {["sun", "cloud", "over", "snow", "rain", "wind", "fog"].map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <input
            className={adminInput}
            value={weather.txt}
            placeholder="Цэлмэг"
            onChange={(e) => setWeather({ ...weather, txt: e.target.value })}
          />
        </div>
        <SaveBar
          k="weather"
          busy={busy}
          done={done}
          onSave={() =>
            void save("weather", () =>
              trpc.studioAdmin.site.mutate({ key: "weather", value: weather }),
            )
          }
        />
      </Panel>

      {/* 6 — Валютын ханш */}
      <Panel title="Валютын ханш (₮)" hint="Зургаа хүртэл. Эхний гурав нь гүйдэг мөрөнд гарна.">
        {fx.map((row, i) => (
          <div key={i} className="mb-2 grid grid-cols-[90px_minmax(0,1fr)_120px_40px] gap-2">
            <input
              className={adminInput}
              dir="ltr"
              maxLength={3}
              value={row.code}
              placeholder="USD"
              onChange={(e) =>
                setFx(
                  fx.map((r, k) =>
                    k === i ? { ...r, code: e.target.value.toUpperCase() } : r,
                  ),
                )
              }
            />
            <input
              className={adminInput}
              type="number"
              step="0.01"
              value={row.value}
              onChange={(e) => setFx(fx.map((r, k) => (k === i ? { ...r, value: Number(e.target.value) } : r)))}
            />
            <input
              className={adminInput}
              type="number"
              step="0.01"
              value={row.change}
              onChange={(e) =>
                setFx(fx.map((r, k) => (k === i ? { ...r, change: Number(e.target.value) } : r)))
              }
            />
            <button
              type="button"
              className={adminButton}
              onClick={() => setFx(fx.filter((_, k) => k !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className={adminButton}
          disabled={fx.length >= 6}
          onClick={() => setFx([...fx, { id: "", code: "", value: 0, change: 0 }])}
        >
          ＋ Валют нэмэх
        </button>
        <SaveBar
          k="fx"
          busy={busy}
          done={done}
          onSave={() =>
            void save("fx", () =>
              trpc.studioAdmin.fx.mutate({
                rows: fx
                  .filter((r) => /^[A-Z]{3}$/.test(r.code) && r.value > 0)
                  .map((r) => ({ code: r.code, value: r.value, change: r.change })),
              }),
            )
          }
        />
      </Panel>

      {/* 7 — Зарын үнийн санал */}
      <Panel title="Зарын үнийн санал" hint="«Сурталчилгаа байршуулах» хуудсанд хүснэгтээр гарна.">
        {rates.map((row, i) => (
          <div key={i} className="mb-2 grid grid-cols-[minmax(0,1fr)_120px_110px_110px_40px] gap-2">
            <input
              className={adminInput}
              value={row.place}
              placeholder="Нүүрний баннер"
              onChange={(e) =>
                setRates(rates.map((r, k) => (k === i ? { ...r, place: e.target.value } : r)))
              }
            />
            <input
              className={adminInput}
              value={row.size ?? ""}
              placeholder="1200×300"
              onChange={(e) =>
                setRates(rates.map((r, k) => (k === i ? { ...r, size: e.target.value } : r)))
              }
            />
            <input
              className={adminInput}
              type="number"
              value={row.price}
              onChange={(e) =>
                setRates(rates.map((r, k) => (k === i ? { ...r, price: Number(e.target.value) } : r)))
              }
            />
            <input
              className={adminInput}
              value={row.unit}
              placeholder="7 хоног"
              onChange={(e) =>
                setRates(rates.map((r, k) => (k === i ? { ...r, unit: e.target.value } : r)))
              }
            />
            <button
              type="button"
              className={adminButton}
              onClick={() => setRates(rates.filter((_, k) => k !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className={adminButton}
          onClick={() =>
            setRates([...rates, { id: "", place: "", size: "", unit: "7 хоног", price: 0 }])
          }
        >
          ＋ Байршил нэмэх
        </button>
        <SaveBar
          k="rates"
          busy={busy}
          done={done}
          onSave={() =>
            void save("rates", () =>
              trpc.studioAdmin.rates.mutate({
                rows: rates
                  .filter((r) => r.place.trim() && r.unit.trim())
                  .map((r) => ({
                    place: r.place,
                    size: r.size || undefined,
                    unit: r.unit,
                    price: r.price,
                  })),
              }),
            )
          }
        />
      </Panel>

      {/* 8 — Ангилал */}
      <Panel
        title="Ангилал ба дэд ангилал"
        hint="Дараалал нь сайтын цэс, хайлтын ангиллын дараалал болно. «Цэсэнд» сонгосон нь толгойн цэсэнд гарна."
      >
        {cats.map((row, i) => (
          <div key={row.id || i} className="mb-2 grid grid-cols-[minmax(0,1fr)_160px_auto_40px] gap-2">
            <input
              className={adminInput}
              value={row.name}
              onChange={(e) =>
                setCats(cats.map((r, k) => (k === i ? { ...r, name: e.target.value } : r)))
              }
            />
            <input
              className={adminInput}
              dir="ltr"
              value={row.slug}
              onChange={(e) =>
                setCats(cats.map((r, k) => (k === i ? { ...r, slug: e.target.value } : r)))
              }
            />
            <label className="flex items-center gap-1.5 font-head text-[12.5px] text-muted">
              <input
                type="checkbox"
                checked={row.inMenu}
                onChange={(e) =>
                  setCats(cats.map((r, k) => (k === i ? { ...r, inMenu: e.target.checked } : r)))
                }
              />
              цэсэнд
            </label>
            <button
              type="button"
              className={adminButton}
              onClick={() => setCats(cats.filter((_, k) => k !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className={adminButton}
          onClick={() =>
            setCats([...cats, { id: "", slug: "", name: "", inMenu: true, order: cats.length }])
          }
        >
          ＋ Ангилал нэмэх
        </button>
        <p className="mt-2 font-head text-[12.5px] text-muted">
          Ангилал устгахад түүний мэдээ үлдэнэ — зүгээр л ангилалгүй болно.
        </p>
        <SaveBar
          k="cats"
          busy={busy}
          done={done}
          onSave={() =>
            void save("cats", () =>
              trpc.studioAdmin.categories.mutate({
                rows: cats
                  .filter((r) => r.name.trim() && r.slug.trim())
                  .map((r) => ({
                    id: r.id || undefined,
                    slug: r.slug,
                    name: r.name,
                    inMenu: r.inMenu,
                  })),
              }),
            )
          }
        />
      </Panel>

      {/* 9 — Толгой */}
      <Panel title="Толгой хэсэг ба лого" hint="Сайтын бүх хуудсанд.">
        <input
          className={adminInput}
          value={header.tagline}
          placeholder="parlamentnews.mn"
          onChange={(e) => setHeader({ tagline: e.target.value })}
        />
        <SaveBar
          k="header"
          busy={busy}
          done={done}
          onSave={() =>
            void save("header", () =>
              trpc.studioAdmin.site.mutate({ key: "header", value: header }),
            )
          }
        />
      </Panel>

      {/* 10 — Хөл */}
      <Panel title="Хөл хэсэг ба холбоо барих">
        <textarea
          className={`${adminInput} mb-2 min-h-[72px] py-2`}
          value={footer.about}
          placeholder="Хараат бус, хариуцлагатай улс төрийн мэдээ."
          onChange={(e) => setFooter({ ...footer, about: e.target.value })}
        />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <input
            className={adminInput}
            dir="ltr"
            value={footer.email}
            placeholder="info@parlamentnews.mn"
            onChange={(e) => setFooter({ ...footer, email: e.target.value })}
          />
          <input
            className={adminInput}
            dir="ltr"
            value={footer.phone}
            placeholder="+976 7000 0000"
            onChange={(e) => setFooter({ ...footer, phone: e.target.value })}
          />
        </div>
        <SaveBar
          k="footer"
          busy={busy}
          done={done}
          onSave={() =>
            void save("footer", () =>
              trpc.studioAdmin.site.mutate({ key: "footer", value: footer }),
            )
          }
        />
      </Panel>

      {/* 11 — RSS */}
      <Panel title="RSS мэдээний суваг" hint="Сүүлийн 50 нийтлэгдсэн мэдээ.">
        <label className="flex items-center gap-2 font-head text-sm text-ink">
          <input
            type="checkbox"
            checked={feed.rss}
            onChange={(e) => setFeed({ rss: e.target.checked })}
          />
          RSS сувгийг сайт дээр нийтлэх
        </label>
        <p className="mt-2 font-head text-[12.5px] text-muted" dir="ltr">
          https://parlamentnews.mn/rss.xml
        </p>
        <SaveBar
          k="feed"
          busy={busy}
          done={done}
          onSave={() =>
            void save("feed", () => trpc.studioAdmin.site.mutate({ key: "feed", value: feed }))
          }
        />
      </Panel>
    </>
  );
}

function toLiveInput(live: SettingsData["live"]) {
  return {
    attendance: live.attendance,
    sessionStatus: live.sessionStatus,
    tickerOn: live.tickerOn,
    liveOn: live.liveOn,
    liveTitle: live.liveTitle ?? undefined,
    liveUrl: live.liveUrl ?? undefined,
    breakingOn: live.breakingOn,
    breakingText: live.breakingText ?? undefined,
    breakingPostId: live.breakingPostId ?? undefined,
  };
}
