import Link from "next/link";

/**
 * Хуудаслалт. Холбоос нь жинхэнэ `<a href>` — JS-гүй ч ажиллана, робот ч дагана.
 */
export function Pager({
  page,
  pages,
  basePath,
  query,
}: {
  page: number;
  pages: number;
  basePath: string;
  /** Хадгалах нэмэлт параметрүүд (жишээ нь хайлтын `q`) */
  query?: Record<string, string>;
}) {
  if (pages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      aria-label="Хуудаслалт"
      className="mt-10 flex items-center justify-between border-t border-rule/20 pt-4 font-head text-sm"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className="hover:text-cob">
          ← Өмнөх
        </Link>
      ) : (
        <span className="text-muted/50">← Өмнөх</span>
      )}

      <span className="text-muted">
        {page} / {pages}
      </span>

      {page < pages ? (
        <Link href={href(page + 1)} rel="next" className="hover:text-cob">
          Дараах →
        </Link>
      ) : (
        <span className="text-muted/50">Дараах →</span>
      )}
    </nav>
  );
}
