import { Search, PenTool, Code2, Rocket, TrendingUp, type LucideIcon } from "lucide-react";

export const stats = [
  { value: 120, suffix: "+", label: "Амжилттай төсөл" },
  { value: 50, suffix: "+", label: "Хамтрагч байгууллага" },
  { value: 8, suffix: " жил", label: "Салбарын туршлага" },
  { value: 98, suffix: "%", label: "Үйлчлүүлэгчийн ханамж" },
];

export type ProcessStep = {
  icon: LucideIcon;
  step: string;
  title: string;
  description: string;
};

export const processSteps: ProcessStep[] = [
  {
    icon: Search,
    step: "01",
    title: "Судалгаа",
    description:
      "Таны бизнес, зорилго, хэрэглэгчийг гүн судалж, амжилтын хэмжүүрийг тодорхойлно.",
  },
  {
    icon: PenTool,
    step: "02",
    title: "Дизайн",
    description:
      "Хэрэглэгчийн аяллыг зурж, прототип бүтээж, брэндэд нийцсэн интерфейс зохион бүтээнэ.",
  },
  {
    icon: Code2,
    step: "03",
    title: "Хөгжүүлэлт",
    description:
      "Орчин үеийн технологиор хурдан, аюулгүй, өргөтгөх боломжтой шийдэл бүтээнэ.",
  },
  {
    icon: Rocket,
    step: "04",
    title: "Нэвтрүүлэлт",
    description:
      "Чанарын тест хийж, гүйцэтгэлийг оновчлон, найдвартай орчинд байршуулна.",
  },
  {
    icon: TrendingUp,
    step: "05",
    title: "Өсөлт",
    description:
      "Тоон үзүүлэлтэд тулгуурлан тасралтгүй сайжруулж, бизнесийн өсөлтийг дэмжинэ.",
  },
];

export const values = [
  {
    title: "Чанар, нарийвчлал",
    description:
      "Бид пикселийн нарийвчлал, кодын чанарт хэзээ ч буулт хийдэггүй. Дэлгэрэнгүй зүйл бүхэн чухал.",
  },
  {
    title: "Үр дүнд тулгуурласан",
    description:
      "Гоо сайхнаас илүү бид хэмжигдэхүйц бизнесийн үр дүнг чухалчилдаг.",
  },
  {
    title: "Ил тод түншлэл",
    description:
      "Төслийн явц, шийдвэр, зардлыг ил тод байлгаж, жинхэнэ түнш байдлаар ажилладаг.",
  },
  {
    title: "Тасралтгүй хөгжил",
    description:
      "Технологийн хамгийн сүүлийн чиг хандлагыг судалж, шийдэлдээ тууштай нэвтрүүлдэг.",
  },
];

export const team = [
  { name: "Б. Тэмүүжин", role: "Үүсгэн байгуулагч / CEO", avatar: "https://i.pravatar.cc/240?img=15" },
  { name: "Э. Анударь", role: "Бүтээлч захирал", avatar: "https://i.pravatar.cc/240?img=32" },
  { name: "Ч. Батбаяр", role: "Технологийн захирал", avatar: "https://i.pravatar.cc/240?img=51" },
  { name: "О. Сарангэрэл", role: "Тэргүүлэх дизайнер", avatar: "https://i.pravatar.cc/240?img=24" },
  { name: "Б. Мөнхзул", role: "AI инженер", avatar: "https://i.pravatar.cc/240?img=60" },
  { name: "Т. Нямбаяр", role: "Төслийн менежер", avatar: "https://i.pravatar.cc/240?img=11" },
];

export const clients = [
  "Алтан Банк",
  "Gobi Cashmere",
  "MedAssist",
  "EduMongolia",
  "TransportFlow",
  "Нийслэл",
  "MobiCom",
  "Shoppy",
];

/**
 * Technology stack we build with. `slug` is the Simple Icons slug
 * (logos served from https://cdn.simpleicons.org/<slug>/<hex>).
 */
export const techStack: { name: string; slug: string }[] = [
  { name: "Next.js", slug: "nextdotjs" },
  { name: "React", slug: "react" },
  { name: "TypeScript", slug: "typescript" },
  { name: "Tailwind CSS", slug: "tailwindcss" },
  { name: "Framer Motion", slug: "framer" },
  { name: "Node.js", slug: "nodedotjs" },
  { name: "Prisma", slug: "prisma" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "Vercel", slug: "vercel" },
  { name: "Radix UI", slug: "radixui" },
  { name: "Resend", slug: "resend" },
  { name: "Zod", slug: "zod" },
  { name: "OpenAI", slug: "openai" },
  { name: "Figma", slug: "figma" },
];
