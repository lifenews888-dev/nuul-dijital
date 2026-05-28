import type { Metadata } from "next";
import "./globals.css";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nuul.digital";
const TITLE = "Nuul.digital — Монголын дижитал маркетинг агентлаг";
const DESCRIPTION =
  "Дижитал маркетинг, FB контент бүүст, вэбсайт хийх, AI чатбот — Монголын бизнесүүдэд зориулсан иж бүрэн агентлаг үйлчилгээ.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Nuul.digital",
  },
  description: DESCRIPTION,
  keywords:
    "дижитал маркетинг монгол, FB контент, facebook ads, вэбсайт хийх, AI чатбот монгол, маркетинг агентлаг, домэйн mn, хостинг монгол, CRM, nuul.digital, QPay",
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Nuul.digital",
    locale: "mn_MN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-dm antialiased">
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
