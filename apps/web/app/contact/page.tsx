"use client";

import { useState } from "react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

const subjects = ["Домэйн", "Хостинг", "Чатбот", "CRM", "Бусад"];

const contactInfo = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.77 20.99 20.48 21 20.15 21C10.62 21 3 13.38 3 3.85C3 3.52 3.01 3.23 3.03 3C3.07 2.44 3.52 2 4.08 2H7.08C7.56 2 7.97 2.33 8.06 2.8C8.15 3.28 8.3 3.88 8.52 4.5C8.65 4.87 8.56 5.29 8.28 5.57L6.62 7.23C7.97 9.67 10.33 12.03 12.77 13.38L14.43 11.72C14.71 11.44 15.13 11.35 15.5 11.48C16.12 11.7 16.72 11.85 17.2 11.94C17.67 12.03 18 12.44 18 12.92V16.92H22Z" stroke="#6C63FF" strokeWidth="1.5" />
      </svg>
    ),
    label: "Утас",
    value: "+976 9911-2233",
    href: "tel:+97699112233",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="3" stroke="#6C63FF" strokeWidth="1.5" />
        <path d="M2 7L12 13L22 7" stroke="#6C63FF" strokeWidth="1.5" />
      </svg>
    ),
    label: "Имэйл",
    value: "info@nuul.digital",
    href: "mailto:info@nuul.digital",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#6C63FF" strokeWidth="1.5" />
        <circle cx="12" cy="9" r="2.5" stroke="#6C63FF" strokeWidth="1.5" />
      </svg>
    ),
    label: "Хаяг",
    value: "Улаанбаатар, Монгол",
    href: null,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#6C63FF" strokeWidth="1.5" />
        <path d="M12 6V12L16 14" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "Ажлын цаг",
    value: "Даваа - Баасан, 09:00-18:00",
    href: null,
  },
];

const faqItems = [
  {
    q: "Үйлчилгээний төлбөр яаж хийх вэ?",
    a: "QPay, SocialPay, банкны шилжүүлэг, VISA/Mastercard зэрэг бүх төлбөрийн хэлбэрийг дэмждэг. Автомат сунгалтын тохиргоо хийх боломжтой.",
  },
  {
    q: "Техникийн дэмжлэг хэрхэн авах вэ?",
    a: "Dashboard-оос тикет үүсгэх, чат бичих, эсвэл info@nuul.digital руу имэйл илгээнэ үү. AI дэмжлэг 24/7 ажилладаг.",
  },
  {
    q: "Домэйн шилжүүлэх боломжтой юу?",
    a: "Тийм. Өөр бүртгэгчээс Nuul.digital руу домэйнээ шилжүүлэх бүрэн боломжтой. Шилжүүлэлт 1-5 ажлын өдөр үргэлжилнэ.",
  },
  {
    q: "Туршилтын хугацаа байгаа юу?",
    a: "Хостинг болон чатбот үйлчилгээнд 14 хоногийн үнэгүй туршилт байдаг. Төлбөрийн мэдээлэл оруулах шаардлагагүй.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Домэйн",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Алдаа гарлаа");

      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "Домэйн", message: "" });
    } catch (err) {
      setError("Мессеж илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    }
    setSending(false);
  };

  return (
    <>
      {/* ── Mesh BG ── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[150px] -top-[200px] h-[700px] w-[700px] animate-drift1 rounded-full bg-[radial-gradient(circle,#7B6FFF22_0%,transparent_65%)]" />
        <div className="absolute -bottom-[150px] -right-[100px] h-[600px] w-[600px] animate-drift2 rounded-full bg-[radial-gradient(circle,#00E5B815_0%,transparent_65%)]" />
        <div className="absolute left-1/2 top-[40%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-drift3 rounded-full bg-[radial-gradient(circle,#7B6FFF18_0%,transparent_65%)]" />
      </div>
      <div className="grid-bg" />

      {/* ── NAV ── */}
      <PublicNav />

      {/* ── HERO ── */}
      <section className="relative z-[2] pt-28 pb-12 text-center px-6 sm:px-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-v/20 bg-v/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-v animate-pulse" />
          <span className="text-xs font-medium text-v-soft">Холбоо барих</span>
        </div>
        <h1 className="font-syne text-3xl font-extrabold text-txt sm:text-4xl lg:text-5xl">
          Холбоо барих
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-txt-2 sm:text-base">
          Асуулт, санал хүсэлтээ бидэнд илгээнэ үү. 24 цагийн дотор хариулна.
        </p>
      </section>

      {/* ── Contact Form + Info ── */}
      <section className="relative z-[2] mx-auto max-w-5xl px-6 pb-20 sm:px-12">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left - Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-6 sm:p-8">
              {sent ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-400/10">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#4ade80" strokeWidth="1.5" />
                      <path d="M8 12L11 15L16 9" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-syne text-lg font-bold text-txt">
                    Мессеж илгээгдлээ!
                  </h3>
                  <p className="mt-2 text-sm text-txt-2">
                    24 цагт хариулна. Баярлалаа!
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 rounded-lg border border-white/[0.06] px-6 py-2 text-sm text-txt-2 transition-colors hover:border-white/[0.12] hover:text-txt"
                  >
                    Дахин илгээх
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="font-syne text-lg font-bold text-txt">Мессеж илгээх</h2>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-txt-2">Нэр</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                      placeholder="Таны нэр"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-txt-2">Имэйл</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-txt-2">Утас</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                        placeholder="9911-2233"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-txt-2">Сэдэв</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                    >
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-txt-2">Мессеж</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full resize-none rounded-lg border border-white/[0.06] bg-bg-3 px-4 py-2.5 text-sm text-txt outline-none transition-colors focus:border-v/30"
                      placeholder="Таны мессеж..."
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-v to-v-dark py-3 font-syne text-sm font-bold text-white shadow-[0_0_20px_#7B6FFF30] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_#7B6FFF50] disabled:opacity-50"
                  >
                    {sending ? (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    Илгээх
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right - Contact Info */}
          <div className="space-y-4 lg:col-span-2">
            {contactInfo.map((info) => (
              <div
                key={info.label}
                className="rounded-xl border border-white/[0.04] bg-bg-2 p-5 transition-colors hover:border-white/[0.08]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-v/10">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-txt-3">{info.label}</p>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="text-sm font-medium text-txt transition-colors hover:text-v"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-txt">{info.value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Social */}
            <div className="rounded-xl border border-white/[0.04] bg-bg-2 p-5">
              <p className="mb-3 text-xs font-medium text-txt-3">Сошиал</p>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com/nuul.digital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-bg-3 text-txt-2 transition-all hover:border-v/20 hover:text-v"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/nuul.digital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-bg-3 text-txt-2 transition-all hover:border-v/20 hover:text-v"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-[2] mx-auto max-w-3xl px-6 pb-24 sm:px-12">
        <div className="mb-8 text-center">
          <h2 className="font-syne text-2xl font-bold text-txt">Түгээмэл асуултууд</h2>
        </div>

        <div className="flex flex-col gap-2">
          {faqItems.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-white/[0.04] bg-bg-2 transition-colors hover:border-white/[0.08]"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-[14px] font-medium leading-snug text-txt">
                    {item.q}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`flex-shrink-0 text-txt-3 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[13px] leading-relaxed text-txt-2">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <PublicFooter />
    </>
  );
}
