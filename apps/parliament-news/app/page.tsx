import { listPosts } from "../lib/posts";
import { shelfBooks } from "../components/shelf-model";
import { Shelf } from "../components/shelf";
import { PostCard } from "../components/post-card";
import { Hero } from "../components/hero/hero";

export const revalidate = 300;

export default async function HomePage() {
  const [latest, featured] = await Promise.all([
    listPosts({ take: 12 }),
    listPosts({ featured: true, take: 3 }),
  ]);

  if (latest.length === 0) {
    return (
      <div className="mx-auto max-w-page px-4 py-20 text-center">
        <h1 className="font-head text-2xl font-extrabold">Мэдээ хараахан алга</h1>
        <p className="mt-2 text-muted">
          Редакцын хэсгээс мэдээ нийтэлмэгц энд харагдана.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Artifact-ийн hero дүр зураг. Тавиур нь Task 4-т энд орно. */}
      <Hero />

      {/*
        Hero-гийн давхаргууд бүгд fixed тул өндөр эзэлдэггүй. Agreement нь
        artifact-ийнх: агуулга нэг бүтэн дэлгэцийн доороос эхэлж, hero дээр
        гүйж гарна (`.feed { margin-top: 100svh }`). Task 9-д `.feed`-ийн
        бүтцээр солигдоно; толгойн 76px-ийг main-ээс хасна.
      */}
      <div
        className="mx-auto max-w-page px-4"
        style={{ marginTop: "calc(100svh - 76px)" }}
      >
      {/* Тавиур нь ДҮРСЛЭЛ. Агуулга нь доорх жагсаалтад — JS унтарсан ч,
          хайлтын робот ч мэдээг тэндээс уншина. Жагсаалтыг нуухгүй. */}
      <section aria-label="Сүүлийн мэдээ, номын тавиураар" className="py-6">
        <Shelf books={shelfBooks(latest)} />
      </section>

      {featured.length > 0 ? (
        <section className="border-t border-rule/20 py-10">
          <h2 className="font-head text-xs font-bold uppercase tracking-widest text-muted">
            Онцлох
          </h2>
          <div className="mt-5 grid gap-8 md:grid-cols-3">
            {featured.map((post) => (
              <PostCard key={post.slug} post={post} variant="feature" />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-t border-rule/20 py-10">
        <h2 className="font-head text-xs font-bold uppercase tracking-widest text-muted">
          Бүх мэдээ
        </h2>
        <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
      </div>
    </>
  );
}
