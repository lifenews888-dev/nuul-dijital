import Link from "next/link";
import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: "Бидний тухай",
  description:
    "Nuul.digital — Монголын бизнесүүдийг дижитал ертөнцөд хүргэх маркетинг агентлаг. Манай түүх, баг, зорилго.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Бидний тухай — Nuul.digital",
    description: "Монголын бизнесүүдэд зориулсан дижитал маркетинг агентлагийн тухай.",
    url: "/about",
    type: "website",
  },
};

const stats = [
  { value: "1,284+", label: "Харилцагч", icon: "👥" },
  { value: "99.9%", label: "Uptime", icon: "⚡" },
  { value: "24/7", label: "AI дэмжлэг", icon: "🤖" },
  { value: "40%", label: "Зардал хэмнэлт", icon: "📉" },
];

const team = [
  {
    name: "Батбаяр Б.",
    role: "Үүсгэн байгуулагч & CEO",
    avatar: "Б",
    avBg: "#7B6FFF22",
    avColor: "#A89FFF",
    avBorder: "#7B6FFF30",
  },
  {
    name: "Сарантуяа Д.",
    role: "CTO & Lead Engineer",
    avatar: "С",
    avBg: "#00E5B815",
    avColor: "#00E5B8",
    avBorder: "#00E5B825",
  },
  {
    name: "Энхбат Т.",
    role: "Product Manager",
    avatar: "Э",
    avBg: "#FFB02E18",
    avColor: "#FFB02E",
    avBorder: "#FFB02E25",
  },
  {
    name: "Оюунтуяа М.",
    role: "Head of Marketing",
    avatar: "О",
    avBg: "#FF6B9D18",
    avColor: "#FF6B9D",
    avBorder: "#FF6B9D25",
  },
];


export default function AboutPage() {
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
      <section className="relative z-[2] flex min-h-[60vh] flex-col items-center justify-center px-6 pt-28 text-center sm:px-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-v/20 bg-v/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-v animate-pulse" />
          <span className="text-xs font-medium text-v-soft">Бидний тухай</span>
        </div>

        <h1 className="font-syne text-4xl font-extrabold leading-tight text-txt sm:text-5xl lg:text-6xl">
          Nuul.digital —{" "}
          <span className="bg-gradient-to-r from-v-soft to-t bg-clip-text text-transparent">
            Таны дижитал үүл
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-txt-2 sm:text-lg">
          Бид Монголын бизнесүүдэд домэйн, хостинг, вэбсайт, AI чатбот, CRM зэрэг дижитал
          шийдлүүдийг нэг дороос хүргэдэг. Технологийг хялбар, хүртээмжтэй болгож, бизнесийн
          өсөлтийг дэмжих нь бидний зорилго.
        </p>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="relative z-[2] mx-auto max-w-5xl px-6 py-20 sm:px-12">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Mission */}
          <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-v/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#6C63FF" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="6" stroke="#6C63FF" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="2" fill="#6C63FF" />
              </svg>
            </div>
            <h2 className="font-syne text-xl font-bold text-txt">Эрхэм зорилго</h2>
            <p className="mt-3 text-sm leading-relaxed text-txt-2">
              Монголын бизнесүүдийг дижитал ертөнцөд хүргэх. Технологийн мэдлэг, бэлтгэл
              шаардлагагүйгээр бизнес бүр өөрийн дижитал шийдэлтэй байх боломжийг бүрдүүлэх.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-t/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="#00D4AA" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="3" stroke="#00D4AA" strokeWidth="1.5" />
              </svg>
            </div>
            <h2 className="font-syne text-xl font-bold text-txt">Алсын хараа</h2>
            <p className="mt-3 text-sm leading-relaxed text-txt-2">
              2030 он гэхэд Монголын бизнесийн 50%-д дижитал шийдэл бий болгох. Бид зөвхөн
              технологи нийлүүлэгч биш — бизнесүүдийн дижитал хамтрагч байх болно.
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-[2] mx-auto max-w-5xl px-6 pb-20 sm:px-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-2xl border border-white/[0.04] bg-bg-2 p-6 text-center"
            >
              <span className="mb-2 text-2xl">{stat.icon}</span>
              <span className="font-syne text-2xl font-extrabold text-txt sm:text-3xl">
                {stat.value}
              </span>
              <span className="mt-1 text-sm text-txt-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section className="relative z-[2] mx-auto max-w-5xl px-6 pb-20 sm:px-12">
        <div className="mb-10 text-center">
          <h2 className="font-syne text-2xl font-bold text-txt sm:text-3xl">Манай баг</h2>
          <p className="mt-2 text-sm text-txt-2">
            Технологи, бизнес, маркетингийн чиглэлээр туршлагатай мэргэжилтнүүд
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center rounded-2xl border border-white/[0.04] bg-bg-2 p-6 text-center transition-colors hover:border-white/[0.08]"
            >
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
                style={{
                  background: member.avBg,
                  color: member.avColor,
                  border: `1px solid ${member.avBorder}`,
                }}
              >
                {member.avatar}
              </div>
              <h3 className="font-syne text-sm font-bold text-txt">{member.name}</h3>
              <p className="mt-1 text-xs text-txt-2">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-[2] mx-auto max-w-3xl px-6 pb-24 text-center sm:px-12">
        <div className="rounded-2xl border border-v/10 bg-gradient-to-br from-v/5 to-transparent p-10">
          <h2 className="font-syne text-2xl font-bold text-txt sm:text-3xl">
            Бидэнтэй нэгдэх
          </h2>
          <p className="mt-3 text-sm text-txt-2">
            Таны бизнесийн дижитал шилжилтийг бид хамтдаа хийе. Одоо бүртгүүлээд эхлэх цаг болсон.
          </p>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-v to-v-dark px-8 py-3 font-syne text-sm font-bold text-white shadow-[0_0_30px_#7B6FFF40] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_#7B6FFF60]"
          >
            Бүртгүүлэх
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <PublicFooter />
    </>
  );
}
