import type { Metadata } from "next";
import Link from "next/link";
import type { NewsStatus } from "@nuul/db-news";
import { requireStudio } from "../../../../../lib/studio-session";
import { studioPosts, studioCounts, type StudioFilter } from "../../../../../lib/studio-posts";
import { STATUS_LABELS, STATUS_ORDER } from "../../../../../lib/studio-status";
import { canCreate } from "../../../../../lib/permissions";
import { PostRow } from "../../../../../components/studio/post-row";

export const metadata: Metadata = {
  title: "Мэдээнүүд",
};

/** Шүүлтүүр нь URL-д байна — редактор холбоосыг хуваалцаж, сэргээж чадна */
type Search = { status?: string; q?: string; mine?: string };

/** URL-ийн тэмдэгт мөрийг төлөв болгоно. Танихгүйг «бүгд» гэж үзнэ. */
function parseStatus(raw: string | undefined): NewsStatus | "all" {
  if (raw && (STATUS_ORDER as string[]).includes(raw)) return raw as NewsStatus;
  return "all";
}

function href(filter: { status: NewsStatus | "all"; q: string; mine: boolean }): string {
  const p = new URLSearchParams();
  if (filter.status !== "all") p.set("status", filter.status);
  if (filter.q) p.set("q", filter.q);
  if (filter.mine) p.set("mine", "1");
  const qs = p.toString();
  return qs ? `/studio/news?${qs}` : "/studio/news";
}

export default async function StudioNewsPage({ searchParams }: { searchParams: Search }) {
  const { actor, tenantId } = await requireStudio();

  const status = parseStatus(searchParams.status);
  const q = (searchParams.q ?? "").trim();
  const mine = searchParams.mine === "1";

  const filter: StudioFilter = { status, q, mine };

  /**
   * Тоонууд нь ТӨЛӨВӨӨС БУСАД шүүлтээр тоологдоно: «зөвхөн минийх»
   * сонгосон бол чипүүд минийхийг тоолно, гэхдээ «Ноорог» чип нь ноорогийн
   * тоог харуулна — эс бөгөөс сонгосон чип дээр л тоо гарч, бусад нь 0
   * болж, шүүлтүүр ажиллахгүй шиг харагдана.
   */
  const [posts, counts] = await Promise.all([
    studioPosts(tenantId, actor, filter),
    studioCounts(tenantId, actor, { q, mine }),
  ]);

  const total = STATUS_ORDER.reduce((n, s) => n + counts[s], 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3.5">
        <h1 className="font-head text-[26px] font-bold leading-tight tracking-tight md:text-[30px]">
          Мэдээнүүд
        </h1>
        <span className="font-head text-sm text-muted">{total} мэдээ</span>

        {canCreate(actor) ? (
          <Link
            href="/studio/news/new"
            className="ml-auto flex h-10 items-center rounded-lg bg-cob px-4 font-head text-sm font-bold text-white"
          >
            Шинэ мэдээ
          </Link>
        ) : null}
      </div>

      {/* Хайлт нь GET форм — JavaScript-гүйгээр ч ажиллана */}
      <form action="/studio/news" method="get" className="mb-3 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Гарчгаар хайх"
          aria-label="Гарчгаар хайх"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-inp px-3 font-head text-base text-ink md:max-w-[320px]"
        />
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        {mine ? <input type="hidden" name="mine" value="1" /> : null}
        <button
          type="submit"
          className="h-10 rounded-lg border border-line bg-pan px-4 font-head text-sm font-semibold text-ink hover:bg-soft"
        >
          Хайх
        </button>
        {q ? (
          <Link
            href={href({ status, q: "", mine })}
            className="flex h-10 items-center rounded-lg px-3 font-head text-sm font-semibold text-muted hover:text-ink"
          >
            Хайлтыг цэвэрлэх
          </Link>
        ) : null}
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={href({ status: "all", q, mine })}
          aria-current={status === "all" ? "page" : undefined}
          className={
            "flex h-9 items-center rounded-full border px-3.5 font-head text-[13px] font-semibold " +
            (status === "all"
              ? "border-cob bg-soft text-cob"
              : "border-line bg-pan text-muted hover:text-ink")
          }
        >
          Бүгд {total}
        </Link>

        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={href({ status: s, q, mine })}
            aria-current={status === s ? "page" : undefined}
            className={
              "flex h-9 items-center rounded-full border px-3.5 font-head text-[13px] font-semibold " +
              (status === s
                ? "border-cob bg-soft text-cob"
                : "border-line bg-pan text-muted hover:text-ink")
            }
          >
            {STATUS_LABELS[s]} {counts[s]}
          </Link>
        ))}

        <Link
          href={href({ status, q, mine: !mine })}
          aria-pressed={mine}
          className={
            "ml-auto flex h-9 items-center rounded-full border px-3.5 font-head text-[13px] font-semibold " +
            (mine
              ? "border-cob bg-soft text-cob"
              : "border-line bg-pan text-muted hover:text-ink")
          }
        >
          Зөвхөн минийх
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-[14px] border border-line bg-pan px-4 py-10 text-center font-head text-sm text-muted">
          Илэрц алга. Шүүлтүүрээ өөрчилж эсвэл шинэ мэдээ нэмээрэй.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-line bg-pan">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} actor={actor} />
          ))}
        </div>
      )}
    </>
  );
}
