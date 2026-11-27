import type { Metadata } from "next";
import Link from "next/link";
import { requireStudio } from "../../../../../lib/studio-session";
import { studioMedia, MEDIA_PAGE } from "../../../../../lib/studio-admin";
import { Panel } from "../../../../../components/studio/admin/panel";

export const metadata: Metadata = { title: "Медиа сан" };

/**
 * Зургийн сан — admin.html-ийн `v-media`.
 *
 * Файл бүр МЭДЭЭНД харьяалагдана: сан нь тусдаа агуулах биш, аль мэдээнд
 * юу орсныг харах цонх. Иймд засах нь мэдээнийхээ засварлагчид.
 */
export default async function MediaPage({
  searchParams,
}: {
  searchParams: { kind?: string; q?: string };
}) {
  const { tenantId } = await requireStudio();

  const kind = searchParams.kind === "video" ? "video" : searchParams.kind === "image" ? "image" : undefined;
  const q = (searchParams.q ?? "").trim();
  const items = await studioMedia(tenantId, { kind, q });

  const chip = (key: string | undefined, label: string) => {
    const active = searchParams.kind === key || (key === undefined && !searchParams.kind);
    return (
      <Link
        key={label}
        href={key ? `/studio/media?kind=${key}` : "/studio/media"}
        aria-current={active ? "page" : undefined}
        className={
          "flex h-9 items-center rounded-full border px-3.5 font-head text-[13px] font-semibold " +
          (active ? "border-cob bg-soft text-cob" : "border-line bg-pan text-muted hover:text-ink")
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline gap-3">
        <h1 className="font-head text-[26px] font-bold tracking-tight md:text-[30px]">Медиа сан</h1>
        <span className="font-head text-sm text-muted">{items.length} файл</span>
      </div>

      <form action="/studio/media" method="get" className="mb-3 flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Мэдээний гарчгаар хайх"
          aria-label="Медиа хайх"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-inp px-3 font-head text-base text-ink md:max-w-[320px]"
        />
        <button
          type="submit"
          className="h-10 rounded-lg border border-line bg-pan px-4 font-head text-sm font-semibold text-ink"
        >
          Хайх
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {chip(undefined, "Бүгд")}
        {chip("image", "Зураг")}
        {chip("video", "Видео")}
      </div>

      <Panel
        title="Байршуулсан файлууд"
        hint={`Файл бүр мэдээндээ харьяалагдана — засах бол тухайн мэдээг нээнэ. Сүүлийн ${MEDIA_PAGE} файл.`}
      >
        {items.length === 0 ? (
          <p className="font-head text-[13px] text-muted">Файл алга.</p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4 xl:grid-cols-6">
            {items.map((m) => (
              <li key={m.id}>
                <Link href={`/studio/news/${m.postId}`} className="block">
                  {m.kind === "video" ? (
                    <span className="grid aspect-[4/3] place-items-center rounded-lg bg-soft font-head text-[12px] font-bold text-cob">
                      ВИДЕО
                    </span>
                  ) : (
                    <img
                      src={m.url}
                      alt={m.caption ?? ""}
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-lg object-cover"
                    />
                  )}
                  <span className="mt-1 block truncate font-head text-[12px] text-muted">
                    {m.postTitle}
                  </span>
                  {m.caption ? (
                    <span className="block truncate font-head text-[11.5px] text-muted/80">
                      {m.caption}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
