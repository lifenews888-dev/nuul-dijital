import { homeData } from "../lib/home-data";
import { shelfBooks } from "../components/shelf-model";
import { PostCard } from "../components/post-card";
import { Hero } from "../components/hero/hero";
import { Shelf3D } from "../components/hero/shelf3d";
import { Timeline } from "../components/hero/timeline";
import { Ticker } from "../components/hero/ticker";
import { WidgetAttendance } from "../components/hero/widget-attendance";
import { WidgetAgenda } from "../components/hero/widget-agenda";
import { StoriesRail } from "../components/hero/stories-rail";

export const revalidate = 300;

export default async function HomePage() {
  // Нүүрний бүх өгөгдөл НЭГ уншилтаар — виджет бүр өөрөө санд очихгүй
  const { latest, featured, stories, live, agenda, ticker } = await homeData();

  const books = shelfBooks(latest);

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
      {/* Artifact-ийн hero дүр зураг, дотор нь 3D номын тавиур */}
      <Hero live={live}>
        <Ticker posts={latest} ads={ticker} on={live?.tickerOn ?? false} />
        <StoriesRail stories={stories} />
        <WidgetAttendance live={live} />
        <WidgetAgenda agenda={agenda} />

        <Shelf3D books={books} />
        {/*
          Шугамын он нь хамгийн шинэ мэдээний он — 12 сарын хуваарь нь
          дэлгэцэнд байгаа мэдээг хүрээлнэ. Огноо бүр ӨӨРИЙН оны хувиар
          тавигдана (`yearFraction`), тул өмнөх оны мэдээ ч өөрийн сард
          бууна, шугамын хилд овоорохгүй.
        */}
        <Timeline
          year={latest[0].date.getUTCFullYear()}
          events={books.map((b) => b.fraction)}
        />
      </Hero>

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
