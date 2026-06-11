import { PageHeader } from "@/components/shared/page-header";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Нууцлалын бодлого", path: "/legal/privacy" });

const sections = [
  {
    h: "1. Бид ямар мэдээлэл цуглуулдаг вэ",
    p: "Бид холбоо барих хэлбэр, үнийн санал авах хүсэлт, имэйл бүртгэлээр дамжуулан таны нэр, имэйл, утас, байгууллагын мэдээллийг цуглуулна.",
  },
  {
    h: "2. Мэдээллийг хэрхэн ашигладаг вэ",
    p: "Цуглуулсан мэдээллийг зөвхөн таны хүсэлтэд хариу өгөх, үйлчилгээ үзүүлэх, болон таны зөвшөөрснөөр маркетингийн мэдээлэл хүргэх зорилгоор ашиглана.",
  },
  {
    h: "3. Мэдээллийн аюулгүй байдал",
    p: "Бид таны хувийн мэдээллийг хамгаалахын тулд салбарын стандартад нийцсэн аюулгүй байдлын арга хэмжээг авдаг.",
  },
  {
    h: "4. Гуравдагч этгээд",
    p: "Бид таны мэдээллийг таны зөвшөөрөлгүйгээр гуравдагч этгээдэд худалдахгүй, түрээслэхгүй.",
  },
  {
    h: "5. Холбоо барих",
    p: "Нууцлалтай холбоотой асуулт байвал hello@nuul.digital хаягаар холбогдоно уу.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader label="Хууль эрх зүй" title="Нууцлалын бодлого" />
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
