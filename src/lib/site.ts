export const siteConfig = {
  name: "Nuul Digital",
  shortName: "Nuul",
  // Tagline (MN): "We build Mongolia's digital future"
  tagline: "Монголын дижитал ирээдүйг бүтээнэ",
  description:
    "Nuul Digital — вэб хөгжүүлэлт, AI чатбот, бизнес автоматжуулалт, e-commerce, мобайл апп, брэндинг болон cloud шийдлээр Монголын байгууллагуудын дижитал шилжилтийг түргэсгэдэг орчин үеийн агентлаг.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nuul.digital",
  ogImage: "/og.png",
  locale: "mn_MN",
  email: "hello@nuul.digital",
  phone: "+976 7700 0000",
  address: "Сүхбаатар дүүрэг, Улаанбаатар, Монгол улс",
  social: {
    facebook: "https://facebook.com/nuuldigital",
    instagram: "https://instagram.com/nuuldigital",
    linkedin: "https://linkedin.com/company/nuuldigital",
    twitter: "https://twitter.com/nuuldigital",
  },
};

export const navLinks = [
  { label: "Нүүр", href: "/" },
  { label: "Бидний тухай", href: "/about" },
  { label: "Үйлчилгээ", href: "/services" },
  { label: "Домэйн", href: "/domains" },
  { label: "Хостинг", href: "/hosting" },
  { label: "Имэйл", href: "/business-email" },
  { label: "Салбарууд", href: "/industries" },
  { label: "Портфолио", href: "/portfolio" },
  { label: "Кейс судалгаа", href: "/case-studies" },
  { label: "Блог", href: "/blog" },
  { label: "Ажлын байр", href: "/careers" },
  { label: "Холбоо барих", href: "/contact" },
];

export const footerNav = [
  {
    title: "Компани",
    links: [
      { label: "Бидний тухай", href: "/about" },
      { label: "Ажлын байр", href: "/careers" },
      { label: "Блог", href: "/blog" },
      { label: "Холбоо барих", href: "/contact" },
    ],
  },
  {
    title: "Үйлчилгээ",
    links: [
      { label: "Вэб хөгжүүлэлт", href: "/services/web-development" },
      { label: "AI чатбот", href: "/services/ai-chatbots" },
      { label: "Автоматжуулалт", href: "/services/automation" },
      { label: "E-commerce", href: "/services/ecommerce" },
      { label: "Мобайл апп", href: "/services/mobile-apps" },
    ],
  },
  {
    title: "Бүтээгдэхүүн",
    links: [
      { label: "Домэйн хайх", href: "/domains" },
      { label: "Вэб хостинг", href: "/hosting" },
      { label: "Бизнес имэйл", href: "/business-email" },
      { label: "SSL баталгаажуулалт", href: "/ssl" },
      { label: "Захиалга харах", href: "/orders/lookup" },
    ],
  },
  {
    title: "Нөөц",
    links: [
      { label: "Төслийн бриф / Үнийн санал", href: "/quote" },
      { label: "Портфолио", href: "/portfolio" },
      { label: "Кейс судалгаа", href: "/case-studies" },
      { label: "Нууцлалын бодлого", href: "/legal/privacy" },
    ],
  },
];

export type SiteConfig = typeof siteConfig;
