import { ScrollReveal } from "@/components/scroll-reveal";
import { ServiceGrid } from "@/components/landing/ServiceGrid";

const services = [
  {
    name: "Дижитал маркетинг",
    desc: "Facebook, Instagram, Google Ads — зорилтот хэрэглэгчид хүргэж борлуулалтыг нэмэгдүүлнэ",
    tag: "ROI 3-5x",
    iconBg: "#7B6FFF18",
    iconBorder: "#7B6FFF25",
    tagBg: "#7B6FFF12",
    tagColor: "#9F98FF",
    glow: "#7B6FFF40",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M2 12L6 8L9 11L14 4" stroke="#7B6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 4L14 4L14 8" stroke="#7B6FFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "FB контент бүүст",
    desc: "Facebook post, reels, story контент бүтээж зорилтот audience-д хүргэнэ",
    tag: "Сарын багц",
    iconBg: "#00E5B815",
    iconBorder: "#00E5B825",
    tagBg: "#00E5B812",
    tagColor: "#00E5B8",
    glow: "#00E5B840",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M10 2L13 2L13 5" stroke="#00E5B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 2L8 7" stroke="#00E5B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 4L3 4C2.4 4 2 4.4 2 5L2 13C2 13.6 2.4 14 3 14L11 14C11.6 14 12 13.6 12 13L12 10" stroke="#00E5B8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Вэбсайт хийх",
    featureKey: "feature_website_builder",
    desc: "Таны бизнест тохирсон мэргэжлийн вэбсайтыг загвартайгаар хийж өгнө",
    tag: "Загвар 50+",
    iconBg: "#FFB02E18",
    iconBorder: "#FFB02E25",
    tagBg: "#FFB02E12",
    tagColor: "#FFB02E",
    glow: "#FFB02E40",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="8" rx="1.5" stroke="#FFB02E" strokeWidth="1.3" />
        <line x1="5" y1="13" x2="11" y2="13" stroke="#FFB02E" strokeWidth="1.5" />
        <line x1="8" y1="11" x2="8" y2="13" stroke="#FFB02E" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    name: "AI Чатбот",
    featureKey: "feature_chatbot",
    externalUrl: "https://yria.mn",
    desc: "Монгол хэлтэй AI чатбот yria.mn. Facebook, вэбсайт, Viber-д зэрэг ажиллана",
    tag: "yria.mn",
    iconBg: "#9F98FF18",
    iconBorder: "#9F98FF25",
    tagBg: "#9F98FF12",
    tagColor: "#9F98FF",
    glow: "#9F98FF40",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M3 11L2 14L5.5 12.5C6.2 13.1 7 13.5 8 13.5C11.1 13.5 13.5 11.4 13.5 8.8C13.5 6.2 11.1 4 8 4C4.9 4 2.5 6.2 2.5 8.8C2.5 9.6 2.7 10.4 3 11Z" stroke="#9F98FF" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    name: "Домэйн & Хост",
    featureKey: "feature_domain",
    comingSoon: true,
    desc: ".mn .com .org хаяг бүртгэх үйлчилгээ тун удахгүй нээгдэнэ",
    tag: "Тун удахгүй",
    iconBg: "#7B6FFF18",
    iconBorder: "#7B6FFF25",
    tagBg: "#7B6FFF12",
    tagColor: "#9F98FF",
    glow: "#7B6FFF40",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="#7B6FFF" strokeWidth="1.3" />
        <ellipse cx="8" cy="8" rx="2.5" ry="5.5" stroke="#7B6FFF" strokeWidth="1.1" />
        <line x1="2.5" y1="8" x2="13.5" y2="8" stroke="#7B6FFF" strokeWidth="1.1" />
      </svg>
    ),
  },
  {
    name: "CRM Pipeline",
    featureKey: "feature_crm",
    desc: "Харилцагчийн мэдээлэл, борлуулалтын дарааллыг нэг дороос хянах",
    tag: "Kanban + List",
    iconBg: "#FF6B9D18",
    iconBorder: "#FF6B9D25",
    tagBg: "#FF6B9D12",
    tagColor: "#FF6B9D",
    glow: "#FF6B9D40",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="5.5" cy="5" r="2.5" stroke="#FF6B9D" strokeWidth="1.3" />
        <path d="M1.5 13C1.5 10.8 3.3 9 5.5 9" stroke="#FF6B9D" strokeWidth="1.3" />
        <path d="M11 8L13 10L15 7" stroke="#FF6B9D" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Call Center",
    featureKey: "feature_call_center",
    desc: "Callpro AI технологитой. Хоногийн 24 цаг автомат хариулт",
    tag: "24/7 · AI",
    iconBg: "#9F98FF18",
    iconBorder: "#9F98FF25",
    tagBg: "#9F98FF12",
    tagColor: "#9F98FF",
    glow: "#9F98FF40",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <path d="M4 2.5C4 2.5 2.5 4 2.5 6.5C2.5 10.5 5.5 13.5 9.5 13.5C12 13.5 13.5 12 13.5 12L11.5 10L9.5 11.5C9.5 11.5 7 9.5 4.5 6.5L6 4.5Z" stroke="#9F98FF" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "eSeller",
    featureKey: "feature_eseller",
    desc: "QPay & SocialPay интегратэй. Захиалга хүлээн авч автомат идэвхжүүл",
    tag: "98.7% автомат",
    iconBg: "#00E5B815",
    iconBorder: "#00E5B825",
    tagBg: "#00E5B812",
    tagColor: "#00E5B8",
    glow: "#00E5B840",
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="6" cy="12" r="1.2" fill="#00E5B8" />
        <circle cx="12" cy="12" r="1.2" fill="#00E5B8" />
        <path d="M2 3L4 3L5.5 9L12.5 9L14 5L5 5" stroke="#00E5B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function ServicesSection() {
  return (
    <ScrollReveal>
      <section id="svc" className="relative z-[2] px-6 py-24 sm:px-12">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-v">
          <span className="inline-block h-px w-6 bg-v" />
          Үйлчилгээ
        </div>
        <h2 className="mb-3 font-clash text-[clamp(32px,4vw,48px)] font-bold leading-tight tracking-tight">
          Нэг платформ.
          <br />
          Бүх зүйл.
        </h2>
        <p className="mb-14 max-w-[500px] text-[15px] leading-relaxed text-txt-2">
          Өрсөлдөгчдийнх шиг 3 өөр компанид төлж, 3 өөр хаяг санах хэрэггүй.
        </p>

        <ServiceGrid services={services} />
      </section>
    </ScrollReveal>
  );
}
