import type { Metadata } from "next";
import { Inter_Tight, Noto_Serif, PT_Serif } from "next/font/google";
import "./globals.css";

/**
 * ҮНДСЭН бүрхүүл — ЗӨВХӨН `<html>`, `<body>`, фонт, горим.
 *
 * Нийтийн сайтын толгой, хөл, цэс нь `(site)/layout.tsx`-д, редакцын
 * студийн бүрхүүл нь `(studio)/layout.tsx`-д. Хоёулаа энэ файлын дотор
 * орших ба тус тусын хүрээгээ өөрсдөө зурна: студид нийтийн толгой,
 * гүйдэг мөр, хөл ХЭРЭГГҮЙ, нийтийн хуудсанд студийн хажуугийн самбар
 * хэрэггүй.
 *
 * Фонт ба горимыг энд нэг удаа тавьсан нь хоёр бүрхүүлд хуулагдахаас
 * хамгаална: `next/font` нь нэр бүрийг хэш болгодог тул хоёр дахин
 * дуудвал хоёр өөр хувилбар татагдана.
 */

/**
 * Хадгалсан горимыг БУДАХААС ӨМНӨ тавина.
 *
 * `<body>`-гийн эхний элемент тул хөтөч үүнийг ажиллуулж дуусахаас нааш
 * юу ч будахгүй: цайвар горимтой хүн бараан дэвсгэрийг нэг кадр ч харахгүй.
 * `localStorage` нь хувийн цонхонд шиддэг — `try/catch`.
 */
const THEME_BOOT =
  "try{var t=localStorage.getItem('pn_theme');if(t==='dark'||t==='light')" +
  "document.documentElement.dataset.theme=t}catch(e){}";

/** Гарчиг, шошго — artifact-ийн `Inter Tight` */
const head = Inter_Tight({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-head",
  display: "swap",
});

/** Мэдээний текст — artifact-ийн `Noto Serif` */
const body = Noto_Serif({
  subsets: ["cyrillic", "latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

/** Хавтас, том гарчгийн serif хувилбар — artifact-ийн `PT Serif` */
const title = PT_Serif({
  subsets: ["cyrillic", "latin"],
  weight: ["700"],
  variable: "--font-title",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"),
  title: {
    default: "Парламентын мэдээ",
    template: "%s — Парламентын мэдээ",
  },
  description: "Улсын Их Хурлын мэдээ, хуулийн төслийн явц, чуулганы хуралдаан.",
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={`${head.variable} ${body.variable} ${title.variable}`}>
      {/* flex багана: агуулга богино байсан ч хөл нь доод ирмэгт наалдана */}
      <body className="flex min-h-screen flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        {children}
      </body>
    </html>
  );
}
