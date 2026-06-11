import { PageHeader } from "@/components/shared/page-header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Үйлчилгээний нөхцөл", path: "/legal/terms" });

const sections = [
  {
    h: "1. Үйлчилгээний хүрээ",
    p: "Nuul Digital нь вэб хөгжүүлэлт, дизайн, AI, автоматжуулалт зэрэг дижитал үйлчилгээг гэрээний үндсэн дээр үзүүлнэ.",
  },
  {
    h: "2. Төлбөр тооцоо",
    p: "Төслийн төлбөр, хуваарь, нөхцөлийг тал бүрийн хооронд байгуулсан гэрээгээр зохицуулна.",
  },
  {
    h: "3. Оюуны өмч",
    p: "Хүлээлгэн өгсөн бүтээгдэхүүний оюуны өмчийн эрх төлбөр бүрэн төлөгдсөний дараа үйлчлүүлэгчид шилжинэ.",
  },
  {
    h: "4. Хариуцлага",
    p: "Бид үйлчилгээгээ мэргэжлийн өндөр түвшинд үзүүлэхийг эрмэлзэх боловч шууд бус хохиролд хариуцлага хүлээхгүй.",
  },
  {
    h: "5. Холбоо барих",
    p: "Үйлчилгээний нөхцөлтэй холбоотой асуулт байвал hello@nuul.digital хаягаар холбогдоно уу.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader label="Хууль эрх зүй" title="Үйлчилгээний нөхцөл" />
      <section className="container-wide pb-24">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-xl font-bold">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{s.p}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
