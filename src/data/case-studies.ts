export type CaseStudy = {
  slug: string;
  title: string;
  client: string;
  industry: string;
  excerpt: string;
  cover: string;
  duration: string;
  services: string[];
  challenge: string;
  approach: string[];
  solution: string;
  results: { label: string; value: string }[];
  testimonial?: { quote: string; author: string; role: string };
  featured?: boolean;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "altan-bank-transformation",
    title: "Үндэсний банкны дижитал шилжилт",
    client: "Алтан Банк",
    industry: "Санхүү",
    excerpt:
      "Хуучирсан банкны платформыг орчин үеийн, мобайл-эхний дижитал туршлага болгон бүрэн шинэчилсэн нь.",
    cover:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    duration: "6 сар",
    services: ["Вэб хөгжүүлэлт", "UI/UX дизайн", "Cloud дэд бүтэц"],
    challenge:
      "Алтан Банкны хуучин дижитал платформ удаан, хэрэглэхэд төвөгтэй, мобайл төхөөрөмжид тохиромжгүй байсан. Хэрэглэгчид интернэт банк ашиглахаас залхаж, салбар руу хандах нь нэмэгдэж байв.",
    approach: [
      "Хэрэглэгчийн судалгаа, аяллын зураглал хийж асуудлын үндсийг тодорхойлсон",
      "Мобайл-эхний дизайн систем шинээр бүтээсэн",
      "Next.js дээр платформыг дахин архитектурласан",
      "Аюулгүй байдал, гүйцэтгэлийн аудит хийж AWS-д шилжүүлсэн",
    ],
    solution:
      "Бид банкны бүх дижитал хүрэлцээг нэгдсэн дизайн системд тулгуурлан дахин бүтээв. Гүйлгээ, төлбөр, зээлийн үйлчилгээг хялбаршуулж, хуудас ачаалах хугацааг хагасаар бууруулсан.",
    results: [
      { label: "Хэрэглэгчийн идэвх", value: "+68%" },
      { label: "Ачаалах хугацаа", value: "-54%" },
      { label: "Мобайл хөрвүүлэлт", value: "+42%" },
      { label: "Салбарын ачаалал", value: "-30%" },
    ],
    testimonial: {
      quote:
        "Nuul Digital манай дижитал шилжилтийг хүлээлтээс давсан түвшинд хүргэсэн.",
      author: "Б. Энхбаяр",
      role: "Гүйцэтгэх захирал, Алтан Банк",
    },
    featured: true,
  },
  {
    slug: "medassist-ai-automation",
    title: "Эрүүл мэндийн салбарт AI автоматжуулалт",
    client: "MedAssist",
    industry: "Эрүүл мэнд",
    excerpt:
      "Монгол хэлтэй AI чатбот ашиглан өдөрт 5000+ харилцагчийн үйлчилгээг автоматжуулсан нь.",
    cover:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80",
    duration: "4 сар",
    services: ["AI чатбот", "Бизнес автоматжуулалт"],
    challenge:
      "MedAssist-ийн харилцагчийн төв өдөрт олон мянган ижил төстэй асуултад хариулж, ачаалал даах боломжгүй болж, хүлээлгэх хугацаа уртассан.",
    approach: [
      "Түгээмэл асуултуудыг ангилж, мэдлэгийн сан бүтээсэн",
      "Монгол хэл ойлгох LLM дээр суурилсан чатбот хөгжүүлсэн",
      "Эмнэлгийн системтэй (цаг захиалга) холбосон",
      "Хүн рүү шилжүүлэх ухаалаг логик нэмсэн",
    ],
    solution:
      "RAG архитектур дээр суурилсан AI туслах нь өвчтөний асуултад шуурхай, үнэн зөв хариулж, цаг захиалгыг автоматаар бүртгэдэг болсон.",
    results: [
      { label: "Автомат хариулт", value: "87%" },
      { label: "Хариу өгөх хугацаа", value: "-92%" },
      { label: "Сэтгэл ханамж", value: "4.8/5" },
      { label: "Зардлын хэмнэлт", value: "-60%" },
    ],
    testimonial: {
      quote:
        "AI чатбот маань харилцагчийн үйлчилгээний ачааллыг 80% бууруулсан.",
      author: "Д. Тэмүүлэн",
      role: "Үйл ажиллагааны захирал, MedAssist",
    },
    featured: true,
  },
  {
    slug: "gobi-ecommerce-growth",
    title: "Олон улсын зах зээлд e-commerce өсөлт",
    client: "Gobi Cashmere",
    industry: "Жижиглэн худалдаа",
    excerpt:
      "Цахим худалдааны платформыг шинэчлэн, онлайн борлуулалтыг хоёр дахин нэмэгдүүлсэн нь.",
    cover:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80",
    duration: "5 сар",
    services: ["E-commerce систем", "Дижитал маркетинг"],
    challenge:
      "Gobi олон улсын зах зээлд гарахыг зорьж байсан ч хуучин онлайн дэлгүүр нь олон улсын төлбөр, олон хэл, хурдны шаардлагыг хангахгүй байв.",
    approach: [
      "Олон улсын төлбөрийн систем интеграц хийсэн",
      "Олон хэл, валютын дэмжлэг нэмсэн",
      "Бүтээгдэхүүний хуудсыг хөрвүүлэлтэд оновчилсон",
      "SEO ба performance marketing хослуулсан",
    ],
    solution:
      "Next.js дээр суурилсан хурдан, олон улсад бэлэн e-commerce платформ бүтээж, маркетингтай нягт уялдуулсан.",
    results: [
      { label: "Онлайн борлуулалт", value: "+120%" },
      { label: "Сагсны хөрвүүлэлт", value: "+35%" },
      { label: "Дундаж захиалга", value: "+28%" },
      { label: "Олон улсын зочид", value: "+85%" },
    ],
    featured: true,
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
