import { setRequestLocale } from "next-intl/server";
import { ContactSection } from "@/components/sections/contact-section";
import { FaqSection } from "@/components/sections/faq-section";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Холбоо барих",
  description: "Nuul Digital-тэй холбогдоорой. Төслийн талаар ярилцаж, үнэ төлбөргүй зөвлөгөө аваарай.",
  path: "/contact",
});

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="pt-24 lg:pt-28">
      <ContactSection />
      <FaqSection />
    </div>
  );
}
