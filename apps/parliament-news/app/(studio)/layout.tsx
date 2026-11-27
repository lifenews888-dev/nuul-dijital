import type { Metadata } from "next";

/**
 * РЕДАКЦЫН бүрхүүл — нийтийн толгой, гүйдэг мөр, хөлгүй.
 *
 * Энд ХААЛГА БАЙХГҮЙ: нэвтрэх хуудас нь өөрөө `/studio/signin`-д байх тул
 * энэ бүрхүүл `requireStudio()` дуудвал нэвтрээгүй хүн нэвтрэх хуудас руу
 * хязгааргүй чиглүүлэгдэнэ. Хаалга нь `studio/(desk)/layout.tsx`-д —
 * нэвтрэх хуудас түүний ГАДНА.
 */
export const metadata: Metadata = {
  title: { default: "Редакц", template: "%s — Редакц" },
  /** Админы зам хайлтын системд ХЭРЭГГҮЙ */
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen flex-1 flex-col bg-paper text-ink">{children}</div>;
}
