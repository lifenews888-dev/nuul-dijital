export type Project = {
  slug: string;
  name: string;
  industry: string;
  description: string;
  technologies: string[];
  results: { label: string; value: string }[];
  image: string;
  gallery: string[];
  link?: string;
  year: string;
  services: string[];
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "altan-bank",
    name: "Алтан Банк",
    industry: "Санхүү",
    description:
      "Үндэсний банкны дижитал банкны платформыг бүрэн шинэчилж, хэрэглэгчийн туршлагыг сайжруулан, мобайл-эхний дизайнаар дахин бүтээв.",
    technologies: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
    results: [
      { label: "Хэрэглэгчийн идэвх", value: "+68%" },
      { label: "Хуудас ачаалах хугацаа", value: "-54%" },
      { label: "Мобайл хөрвүүлэлт", value: "+42%" },
    ],
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&q=80",
    ],
    link: "https://example.com",
    year: "2025",
    services: ["Вэб хөгжүүлэлт", "UI/UX дизайн", "Cloud дэд бүтэц"],
    featured: true,
  },
  {
    slug: "gobi-cashmere",
    name: "Gobi Cashmere",
    industry: "Жижиглэн худалдаа",
    description:
      "Олон улсын зах зээлд чиглэсэн e-commerce платформ. QPay болон олон улсын картын төлбөр, агуулахын удирдлага бүхий цогц шийдэл.",
    technologies: ["Next.js", "Shopify", "Stripe", "QPay", "Vercel"],
    results: [
      { label: "Онлайн борлуулалт", value: "+120%" },
      { label: "Сагсны хөрвүүлэлт", value: "+35%" },
      { label: "Дундаж захиалга", value: "+28%" },
    ],
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
    ],
    link: "https://example.com",
    year: "2025",
    services: ["E-commerce систем", "Дижитал маркетинг"],
    featured: true,
  },
  {
    slug: "med-assist-ai",
    name: "MedAssist AI",
    industry: "Эрүүл мэнд",
    description:
      "Эмнэлгийн цаг захиалга, өвчтөний асуултад хариулдаг монгол хэлтэй AI чатбот. Өдөрт 5000+ харилцагчид автомат үйлчилгээ үзүүлдэг.",
    technologies: ["Python", "OpenAI", "LangChain", "Next.js", "PostgreSQL"],
    results: [
      { label: "Автомат хариулт", value: "87%" },
      { label: "Хариу өгөх хугацаа", value: "-92%" },
      { label: "Харилцагчийн сэтгэл ханамж", value: "4.8/5" },
    ],
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=80",
    ],
    year: "2024",
    services: ["AI чатбот", "Бизнес автоматжуулалт"],
    featured: true,
  },
  {
    slug: "transport-flow",
    name: "TransportFlow",
    industry: "Логистик",
    description:
      "Тээвэр, хүргэлтийн компанийн үйл ажиллагааг бүрэн автоматжуулсан удирдлагын систем. Бодит цагийн хяналт, маршрут оновчлол.",
    technologies: ["React Native", "Node.js", "MongoDB", "Google Maps API"],
    results: [
      { label: "Хүргэлтийн хугацаа", value: "-31%" },
      { label: "Үйл ажиллагааны зардал", value: "-24%" },
      { label: "Захиалгын багтаамж", value: "+2.5x" },
    ],
    image:
      "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    year: "2024",
    services: ["Бизнес автоматжуулалт", "Мобайл аппликейшн"],
  },
  {
    slug: "edu-mongolia",
    name: "EduMongolia",
    industry: "Боловсрол",
    description:
      "Онлайн сургалтын платформ. Видео хичээл, шалгалт, гэрчилгээ, төлбөрийн системтэй цогц LMS шийдэл.",
    technologies: ["Next.js", "Prisma", "PostgreSQL", "Mux", "QPay"],
    results: [
      { label: "Бүртгүүлсэн суралцагч", value: "12,000+" },
      { label: "Хичээл дуусгалт", value: "+58%" },
      { label: "Орлого", value: "+90%" },
    ],
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    year: "2024",
    services: ["Вэб хөгжүүлэлт", "UI/UX дизайн"],
  },
  {
    slug: "city-gov-portal",
    name: "Нийслэлийн e-Үйлчилгээ",
    industry: "Төрийн байгууллага",
    description:
      "Иргэдэд зориулсан төрийн цахим үйлчилгээний нэгдсэн портал. Бичиг баримт захиалга, төлбөр, мэдэгдлийг нэг дороос.",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Docker", "AWS"],
    results: [
      { label: "Цахим хүсэлт", value: "+150%" },
      { label: "Үйлчилгээний хугацаа", value: "-70%" },
      { label: "Иргэдийн ханамж", value: "4.6/5" },
    ],
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    gallery: [],
    year: "2023",
    services: ["Вэб хөгжүүлэлт", "Cloud дэд бүтэц", "UI/UX дизайн"],
  },
];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}

export const featuredProjects = projects.filter((p) => p.featured);
