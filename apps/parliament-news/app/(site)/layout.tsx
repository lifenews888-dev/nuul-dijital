import { SiteHeader } from "../../components/site-header";
import { SiteFooter } from "../../components/site-footer";
import { SiteMenu } from "../../components/site-menu";
import { menuData } from "../../lib/menu-data";
import { siteInfo } from "../../lib/info-data";

/**
 * НИЙТИЙН сайтын бүрхүүл — artifact-ийн `index.html`-ийн хүрээ.
 *
 * `app/layout.tsx`-аас тусгаарласан шалтгаан нь редакцын студи: тэр нь
 * `/studio`-д байх ба энэ толгой, хөл, цэсийг ХАРУУЛАХ ЁСГҮЙ. Хэрэв хүрээ
 * нь үндсэн бүрхүүлд байвал студийн хуудас бүр нийтийн толгойн доор
 * зурагдаж, редактор өөрийн ажлын талбарыг уншигчийн хуудасны дотор харна.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [{ posts, order }, info] = await Promise.all([menuData(), siteInfo()]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-cob focus:px-3 focus:py-2 focus:text-paper"
      >
        Үндсэн агуулга руу очих
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {/* Цэс нь `header.top`-ийн ГАДНА — тэр нь өөрийн давхаргын хүрээтэй */}
      <SiteMenu posts={posts} order={order} info={info} />
    </>
  );
}
