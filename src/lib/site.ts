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
  phone: "+976 8080 1677",
  address: "Сүхбаатар дүүрэг, Улаанбаатар, Монгол улс",
  social: {
    facebook: "https://facebook.com/nuuldigital",
    instagram: "https://instagram.com/nuuldigital",
    linkedin: "https://linkedin.com/company/nuuldigital",
    twitter: "https://twitter.com/nuuldigital",
  },
};

/** A plain link inside a nav group. `key` resolves under the `nav` namespace. */
export type NavLeaf = { key: string; href: string };

export type NavGroup = {
  /** Translation key under `nav` for the trigger label. */
  key: string;
  /** Overview page for the group, linked from the panel footer. */
  href?: string;
  /**
   * Rich panels build their cards from the matching data module, so titles and
   * icons stay in one place; groups without a panel render `links` as a list.
   */
  panel?: "services" | "products";
  links?: NavLeaf[];
  /** Path prefixes that mark this group as the active one. */
  match: string[];
};

/**
 * Top-level navigation.
 *
 * Twelve flat links overflowed the bar and gave every page the same weight, so
 * the tree is grouped into four triggers that open a panel. The logo is the
 * link home, which is why there is no separate "Нүүр" entry.
 */
export const navGroups: NavGroup[] = [
  {
    key: "services",
    href: "/services",
    panel: "services",
    match: ["/services"],
  },
  {
    key: "products",
    panel: "products",
    match: ["/domains", "/hosting", "/business-email", "/ssl", "/software", "/orders"],
  },
  {
    key: "work",
    links: [
      { key: "portfolio", href: "/portfolio" },
      { key: "caseStudies", href: "/case-studies" },
      { key: "industries", href: "/industries" },
    ],
    match: ["/portfolio", "/case-studies", "/industries"],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "blog", href: "/blog" },
      { key: "careers", href: "/careers" },
      { key: "contact", href: "/contact" },
    ],
    match: ["/about", "/blog", "/careers", "/contact"],
  },
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
      { label: "Программ хангамжийн лиценз", href: "/software" },
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
