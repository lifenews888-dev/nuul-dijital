export type Job = {
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  level: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
};

export const jobs: Job[] = [
  {
    slug: "senior-frontend-engineer",
    title: "Senior Frontend хөгжүүлэгч",
    department: "Инженерчлэл",
    location: "Улаанбаатар / Алсаас",
    type: "Бүтэн цаг",
    level: "Ахлах",
    summary:
      "React, Next.js дээр гайхалтай хэрэглэгчийн интерфейс бүтээх туршлагатай, нарийвчлалд анхаардаг хөгжүүлэгч хайж байна.",
    responsibilities: [
      "Next.js дээр өндөр чанартай вэб аппликейшн хөгжүүлэх",
      "Дизайн багтай хамтран pixel-perfect интерфейс бүтээх",
      "Гүйцэтгэл, хүртээмжийг оновчлох",
      "Кодын чанар, code review-д хувь нэмэр оруулах",
    ],
    requirements: [
      "React, TypeScript-ийн 4+ жилийн туршлага",
      "Next.js, Tailwind CSS гүн мэдлэг",
      "Анимэйшн, micro-interaction-д анхаардаг",
      "Англи хэлний харилцааны түвшин",
    ],
  },
  {
    slug: "ai-engineer",
    title: "AI инженер",
    department: "Инженерчлэл",
    location: "Улаанбаатар",
    type: "Бүтэн цаг",
    level: "Дунд / Ахлах",
    summary:
      "LLM, RAG системд суурилсан ухаалаг шийдэл бүтээх AI инженер хайж байна.",
    responsibilities: [
      "LLM дээр суурилсан чатбот, агент бүтээх",
      "RAG, vector search систем хөгжүүлэх",
      "AI шийдлийг production-д нэвтрүүлэх",
      "Загварын чанар, гүйцэтгэлийг үнэлэх",
    ],
    requirements: [
      "Python болон ML framework-ийн туршлага",
      "OpenAI, LangChain зэрэг хэрэгслийн мэдлэг",
      "Vector database-тэй ажиллаж байсан туршлага",
      "Production систем хөгжүүлэх ойлголт",
    ],
  },
  {
    slug: "product-designer",
    title: "Product дизайнер",
    department: "Дизайн",
    location: "Улаанбаатар / Алсаас",
    type: "Бүтэн цаг",
    level: "Дунд",
    summary:
      "Хэрэглэгч төвтэй, гоо сайхан бүтээгдэхүүний интерфейс зохион бүтээх дизайнер хайж байна.",
    responsibilities: [
      "Хэрэглэгчийн судалгаа, прототип хийх",
      "Figma дээр дизайн систем бүтээх, хөгжүүлэх",
      "Хөгжүүлэгчидтэй нягт хамтран ажиллах",
      "Хэрэглэгчийн тестинг зохион байгуулах",
    ],
    requirements: [
      "Product дизайны 3+ жилийн туршлага",
      "Figma-ийн гүн мэдлэг",
      "Хүчтэй портфолио",
      "UX зарчмын гүн ойлголт",
    ],
  },
  {
    slug: "project-manager",
    title: "Дижитал төслийн менежер",
    department: "Үйл ажиллагаа",
    location: "Улаанбаатар",
    type: "Бүтэн цаг",
    level: "Дунд / Ахлах",
    summary:
      "Олон төслийг зэрэг удирдаж, баг болон үйлчлүүлэгчдийн хооронд гүүр болох менежер хайж байна.",
    responsibilities: [
      "Төслийн төлөвлөлт, хугацаа, төсвийг удирдах",
      "Үйлчлүүлэгчтэй харилцах",
      "Багийн ажлын урсгалыг зохион байгуулах",
      "Эрсдэлийг урьдчилан тооцох",
    ],
    requirements: [
      "Дижитал төслийн удирдлагын 3+ жилийн туршлага",
      "Agile/Scrum аргачлалын мэдлэг",
      "Маш сайн харилцааны ур чадвар",
      "Техникийн суурь ойлголт давуу тал",
    ],
  },
];

export function getJob(slug: string) {
  return jobs.find((j) => j.slug === slug);
}

export const perks = [
  "Уян хатан, алсаас ажиллах боломж",
  "Олон улсын түвшний төслүүд",
  "Тасралтгүй сургалт, хөгжлийн дэмжлэг",
  "Орчин үеийн тоног төхөөрөмж",
  "Эрүүл мэндийн даатгал",
  "Гүйцэтгэлд суурилсан урамшуулал",
];
