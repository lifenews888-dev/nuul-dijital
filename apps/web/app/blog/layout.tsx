import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Дижитал маркетинг, FB контент, AI чатбот, бизнес өсгөх зөвлөгөө — Nuul.digital-ийн блог.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Блог — Nuul.digital",
    description:
      "Дижитал маркетинг, AI, бизнесийн өсөлтийн талаарх Монгол хэлээр гарсан нийтлэлүүд.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
