import type { Metadata } from "next";
import "../studio.css";

/**
 * РЕДАКЦЫН бүрхүүл — нийтийн толгой, гүйдэг мөр, хөлгүй.
 *
 * `.studio` класс нь `app/studio.css`-ийн токенуудыг ЗӨВХӨН энэ дэд модонд
 * нээнэ: `bg-pan`, `border-line`, `bg-rail` гэх утилитууд нийтийн хуудсанд
 * утгагүй, тиймээс студийн өнгө тийшээ гоожиж чадахгүй.
 *
 * Энд ХААЛГА БАЙХГҮЙ: нэвтрэх хуудас нь `/studio/signin`-д, энэ бүрхүүлийн
 * ДОТОР байх тул `requireStudio()`-г энд дуудвал нэвтрээгүй хүн нэвтрэх
 * хуудас руугаа хязгааргүй чиглүүлэгдэнэ. Хаалга нь `studio/(desk)`-д.
 */
export const metadata: Metadata = {
  title: { default: "Редакц", template: "%s — Редакц" },
  /** Админы зам хайлтын системд ХЭРЭГГҮЙ */
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio flex min-h-screen flex-1 flex-col bg-paper text-ink">{children}</div>
  );
}
