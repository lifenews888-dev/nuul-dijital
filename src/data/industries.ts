import {
  Landmark,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Truck,
  Building2,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export type Industry = {
  slug: string;
  icon: LucideIcon;
  name: string;
  short: string;
  description: string;
  challenges: string[];
  solutions: string[];
  /** Slugs from src/data/projects + case-studies to surface as proof. */
  projectSlugs: string[];
  caseStudySlugs: string[];
};

export const industries: Industry[] = [
  {
    slug: "finance",
    icon: Landmark,
    name: "Санхүү ба банк",
    short: "Аюулгүй, найдвартай дижитал банкны туршлага.",
    description:
      "Банк, санхүүгийн байгууллагуудад зориулсан өндөр аюулгүй байдалтай, зохицуулалтын шаардлага хангасан дижитал платформ.",
    challenges: [
      "Хуучирсан систем, удаан үйлчилгээ",
      "Мобайл-эхний хэрэглэгчийн өсөн нэмэгдэх хүлээлт",
      "Аюулгүй байдал, зохицуулалтын нийцэл",
    ],
    solutions: ["Вэб хөгжүүлэлт", "UI/UX дизайн", "Cloud дэд бүтэц", "Бизнес автоматжуулалт"],
    projectSlugs: ["altan-bank"],
    caseStudySlugs: ["altan-bank-transformation"],
  },
  {
    slug: "retail-ecommerce",
    icon: ShoppingBag,
    name: "Жижиглэн худалдаа ба E-commerce",
    short: "Онлайн борлуулалтыг өсгөх цогц худалдааны систем.",
    description:
      "Дотоодын болон олон улсын зах зээлд борлуулалт хийх, төлбөр, агуулах, маркетингийг нэгтгэсэн e-commerce шийдэл.",
    challenges: [
      "Олон сувгийн борлуулалтыг удирдах",
      "Төлбөр, логистикийн интеграц",
      "Хөрвүүлэлт сул вэбсайт",
    ],
    solutions: ["E-commerce систем", "Дижитал маркетинг", "Мобайл аппликейшн"],
    projectSlugs: ["gobi-cashmere"],
    caseStudySlugs: ["gobi-ecommerce-growth"],
  },
  {
    slug: "healthcare",
    icon: HeartPulse,
    name: "Эрүүл мэнд",
    short: "Өвчтөн төвтэй ухаалаг үйлчилгээ.",
    description:
      "Цаг захиалга, өвчтөний харилцаа, AI туслахаар дамжуулан эрүүл мэндийн үйлчилгээг хүртээмжтэй болгоно.",
    challenges: [
      "Харилцагчийн төвийн хэт ачаалал",
      "Цаг захиалгын гар ажиллагаа",
      "Мэдээллийн нууцлал",
    ],
    solutions: ["AI чатбот", "Бизнес автоматжуулалт", "Вэб хөгжүүлэлт"],
    projectSlugs: ["med-assist-ai"],
    caseStudySlugs: ["medassist-ai-automation"],
  },
  {
    slug: "education",
    icon: GraduationCap,
    name: "Боловсрол",
    short: "Орчин үеийн онлайн сургалтын платформ.",
    description:
      "Видео хичээл, шалгалт, гэрчилгээ, төлбөрийн системтэй цогц LMS болон сургалтын платформ.",
    challenges: ["Сургалтын хүртээмж", "Суралцагчийн оролцоо", "Төлбөрийн интеграц"],
    solutions: ["Вэб хөгжүүлэлт", "UI/UX дизайн", "Мобайл аппликейшн"],
    projectSlugs: ["edu-mongolia"],
    caseStudySlugs: [],
  },
  {
    slug: "logistics",
    icon: Truck,
    name: "Тээвэр ба логистик",
    short: "Бодит цагийн хяналт, маршрут оновчлол.",
    description:
      "Хүргэлт, тээврийн үйл ажиллагааг автоматжуулж, бодит цагийн хяналт, маршрут оновчлолоор зардлыг бууруулна.",
    challenges: ["Гар ажиллагаатай хяналт", "Маршрутын үр ашиг", "Захиалгын багтаамж"],
    solutions: ["Бизнес автоматжуулалт", "Мобайл аппликейшн", "Cloud дэд бүтэц"],
    projectSlugs: ["transport-flow"],
    caseStudySlugs: [],
  },
  {
    slug: "government",
    icon: Building2,
    name: "Төрийн байгууллага",
    short: "Иргэдэд ойр цахим үйлчилгээ.",
    description:
      "Иргэдэд зориулсан цахим үйлчилгээний нэгдсэн портал, бичиг баримт, төлбөр, мэдэгдлийг нэг дороос.",
    challenges: ["Цаасан суурьтай процесс", "Урт дараалал", "Үйлчилгээний хүртээмж"],
    solutions: ["Вэб хөгжүүлэлт", "Cloud дэд бүтэц", "UI/UX дизайн"],
    projectSlugs: ["city-gov-portal"],
    caseStudySlugs: [],
  },
  {
    slug: "startups",
    icon: Rocket,
    name: "Стартап",
    short: "Хурдан зах зээлд гарах дижитал бүтээгдэхүүн.",
    description:
      "Санаагаа богино хугацаанд дэлхийн жишгийн бүтээгдэхүүн болгон хувиргаж, хурдан зах зээлд гаргана.",
    challenges: ["Хязгаарлагдмал хугацаа, нөөц", "Зах зээлд хурдан гарах", "Өргөтгөх боломж"],
    solutions: ["Вэб хөгжүүлэлт", "Мобайл аппликейшн", "Брэндинг", "AI чатбот"],
    projectSlugs: [],
    caseStudySlugs: [],
  },
];

export function getIndustry(slug: string) {
  return industries.find((i) => i.slug === slug);
}
