import { homeData } from "../lib/home-data";
import { shelfBooks } from "../components/shelf-model";
import { Hero } from "../components/hero/hero";
import { Shelf3D } from "../components/hero/shelf3d";
import { Timeline } from "../components/hero/timeline";
import { Ticker } from "../components/hero/ticker";
import { WidgetAttendance } from "../components/hero/widget-attendance";
import { WidgetAgenda } from "../components/hero/widget-agenda";
import { StoriesRail } from "../components/hero/stories-rail";
import { HeroFooter } from "../components/hero/hero-footer";
import { HomeFeed } from "../components/home-feed";

export const revalidate = 300;

export default async function HomePage() {
  // Нүүрний бүх өгөгдөл НЭГ уншилтаар — виджет бүр өөрөө санд очихгүй
  const data = await homeData();
  const { latest, stories, live, agenda, ticker } = data;

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

  // Хуулийн шатыг slug-аар — гарчгийн блокийн «Баталсан» тэмдэг
  const stages = Object.fromEntries(data.bills.map((b) => [b.slug, b.stage]));
  const books = shelfBooks(latest, stages);

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
        <HeroFooter />
      </Hero>

      {/*
        Hero-гийн давхаргууд бүгд fixed тул өндөр эзэлдэггүй. Урсгал нь
        өөрөө `.feed { margin-top: 100svh }`-ээр нэг бүтэн дэлгэцийн доороос
        эхэлнэ. `main`-ийн 76px-ийг энд хасахгүй — `.feed` нь өөрөө `main`.
      */}
      <HomeFeed data={data} />
    </>
  );
}
