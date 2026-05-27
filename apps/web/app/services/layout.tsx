import type { Metadata } from "next";
import { Providers } from "@/components/providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Үйлчилгээ",
  description:
    "Дижитал маркетинг, FB контент бүүст, вэбсайт хийх, AI чатбот — Nuul.digital-ийн санал болгох бүх агентлаг үйлчилгээ.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Үйлчилгээ — Nuul.digital",
    description:
      "Дижитал маркетинг, FB контент, вэбсайт, AI чатбот. Бизнесээ өсгөх бүх хэрэгсэл нэг газар.",
    url: "/services",
    type: "website",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
