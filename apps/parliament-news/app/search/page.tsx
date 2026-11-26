import type { Metadata } from "next";
import { countPosts, searchPosts, searchTerm, SEARCH_MAX } from "../../lib/posts";
import { pageParams } from "../../lib/paging";
import { PostCard } from "../../components/post-card";
import { Pager } from "../../components/pager";

/** `q` нь хязгааргүй хувилбартай — кэшлэхгүй */
export const dynamic = "force-dynamic";

const PER_PAGE = 12;

export const metadata: Metadata = {
  title: "Хайлт",
  description: "Парламентын мэдээнээс хайх.",
  robots: { index: false },
};

type Props = {
  searchParams: { q?: string | string[]; page?: string | string[] };
};

export default async function SearchPage({ searchParams }: Props) {
  const raw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const term = searchTerm(raw);

  const total = term ? await countPosts({ q: term }) : 0;
  const { page, skip, take, pages } = pageParams(searchParams.page, PER_PAGE, total);
  const posts = term ? await searchPosts(term, { take, skip }) : [];

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="font-head text-3xl font-extrabold tracking-tight">Хайлт</h1>

      <form action="/search" method="get" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Хайх үг
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={raw ?? ""}
          maxLength={SEARCH_MAX}
          placeholder="Жишээ: төсөв, хуулийн төсөл"
          className="w-full border border-rule/30 bg-sheet px-3 py-2 font-head text-sm"
        />
        <button
          type="submit"
          className="bg-cob px-4 py-2 font-head text-sm font-bold text-paper"
        >
          Хайх
        </button>
      </form>

      {/* Хоосон, зөвхөн зайтай, хэт урт хайлт нь БҮХ мэдээг жагсаахгүй */}
      {!term ? (
        <p className="mt-8 text-muted">
          Хайх үгээ оруулна уу. Гарчиг, товч агуулга, биетээс хайна.
        </p>
      ) : (
        <>
          <p className="mt-6 font-head text-sm text-muted">
            «{term}» — {total} мэдээ
          </p>

          {posts.length === 0 ? (
            <div className="mt-10 text-muted">
              <p>Тохирох мэдээ олдсонгүй.</p>
              {/*
                Хайлт нь одоогоор яг таарсан тэмдэгтээр хайдаг. Монгол хэлэнд
                нөхцөл залгахад эгшиг гээгддэг («төсөв» → «төсвийн») тул толь
                бичгийн хэлбэрээр хайхад олдохгүй байж болно. Үүнийг нуухаас
                илүү уншигчид хэлэх нь зөв — үгийн үндэс хайвал олдоно.
              */}
              <p className="mt-2 text-sm">
                Үгийн үндсээр оролдож үзээрэй: «төсөв» биш «төсв», «хууль» биш «хуул».
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          <Pager page={page} pages={pages} basePath="/search" query={{ q: term }} />
        </>
      )}
    </div>
  );
}
