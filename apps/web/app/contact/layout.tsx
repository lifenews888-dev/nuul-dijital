import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Холбоо барих",
  description:
    "Маркетингийн санал, үнийн судалгаа эсвэл бусад асуултын талаар Nuul.digital-тэй холбогдоорой. Утас, имэйл, Facebook-ээр хариулна.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Холбоо барих — Nuul.digital",
    description: "Маркетингийн санал, үнийн судалгаа, бусад асуултанд хариулна.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
