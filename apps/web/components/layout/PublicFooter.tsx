"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface FooterData {
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  tagline: string;
}

const defaultData: FooterData = {
  phone: "+976 7700-1234",
  email: "info@nuul.digital",
  address: "Улаанбаатар",
  facebook: "https://facebook.com/nuul.digital",
  instagram: "https://instagram.com/nuul.digital",
  tagline: "Монголын бизнесүүдийг дижитал ертөнцөд хүргэх иж бүрэн платформ.",
};

const serviceLinks = [
  { label: "Домэйн", href: "/dashboard/domains" },
  { label: "Хостинг", href: "/dashboard/hosting" },
  { label: "AI Чатбот", href: "/dashboard/chatbot" },
  { label: "CRM", href: "/dashboard/crm" },
  { label: "И-мэйл маркетинг", href: "/dashboard/email-marketing" },
  { label: "Вэбсайт Builder", href: "/dashboard/website-builder" },
];

const companyLinks = [
  { label: "Бидний тухай", href: "/about" },
  { label: "Блог", href: "/blog" },
  { label: "Холбоо барих", href: "/contact" },
  { label: "Мэргэжлийн үйлчилгээ", href: "/services" },
  { label: "Нүүр хуудас", href: "/" },
];

export function PublicFooter() {
  const [data, setData] = useState<FooterData>(defaultData);

  useEffect(() => {
    fetch("/api/footer")
      .then((r) => r.json())
      .then((d) => {
        if (d) setData({ ...defaultData, ...d });
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="relative z-[2] border-t border-[--bd] bg-[#03030A]">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-v to-v-dark">
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L16 14H2Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M9 7L12.5 13H5.5Z" fill="#fff" opacity=".45" />
                  <circle cx="9" cy="9" r="1.6" fill="#fff" />
                </svg>
              </div>
              <span className="font-syne text-[17px] font-semibold">
                nuul<span className="text-v-soft">.mn</span>
              </span>
            </Link>
            <p className="mb-5 text-[13px] leading-relaxed text-txt-3">{data.tagline}</p>
            <div className="flex gap-2.5">
              {data.facebook && (
                <a href={data.facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-txt-3 transition-all hover:border-v/20 hover:text-v">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
              )}
              {data.instagram && (
                <a href={data.instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-txt-3 transition-all hover:border-v/20 hover:text-v">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
              )}
            </div>
          </div>

          {/* Үйлчилгээ */}
          <div>
            <h4 className="mb-4 font-syne text-sm font-bold text-txt">Үйлчилгээ</h4>
            <ul className="flex flex-col gap-2.5">
              {serviceLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-txt-3 transition-colors hover:text-txt-2">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Компани */}
          <div>
            <h4 className="mb-4 font-syne text-sm font-bold text-txt">Компани</h4>
            <ul className="flex flex-col gap-2.5">
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-txt-3 transition-colors hover:text-txt-2">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Холбоо барих */}
          <div>
            <h4 className="mb-4 font-syne text-sm font-bold text-txt">Холбоо барих</h4>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2.5 text-[13px] text-txt-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-v"><path d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.77 20.99 20.48 21 20.15 21C10.62 21 3 13.38 3 3.85C3 3.52 3.01 3.23 3.03 3C3.07 2.44 3.52 2 4.08 2H7.08C7.56 2 7.97 2.33 8.06 2.8C8.15 3.28 8.3 3.88 8.52 4.5C8.65 4.87 8.56 5.29 8.28 5.57L6.62 7.23C7.97 9.67 10.33 12.03 12.77 13.38L14.43 11.72C14.71 11.44 15.13 11.35 15.5 11.48C16.12 11.7 16.72 11.85 17.2 11.94C17.67 12.03 18 12.44 18 12.92V16.92H22Z" stroke="currentColor" strokeWidth="1.5" /></svg>
                <a href={`tel:${data.phone.replace(/\s|-/g, "")}`} className="transition-colors hover:text-txt-2">{data.phone}</a>
              </li>
              <li className="flex items-center gap-2.5 text-[13px] text-txt-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-v"><rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M2 7L12 13L22 7" stroke="currentColor" strokeWidth="1.5" /></svg>
                <a href={`mailto:${data.email}`} className="transition-colors hover:text-txt-2">{data.email}</a>
              </li>
              <li className="flex items-center gap-2.5 text-[13px] text-txt-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-v"><path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" /></svg>
                <span>{data.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.04] px-6 py-5 sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-txt-4">&copy; {new Date().getFullYear()} Nuul Digital LLC</span>
          <div className="flex gap-4">
            <Link href="/about" className="text-[11px] text-txt-4 transition-colors hover:text-txt-3">Нөхцөл</Link>
            <Link href="/about" className="text-[11px] text-txt-4 transition-colors hover:text-txt-3">Нууцлал</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
