import type { Metadata } from "next";
import { siteConfig } from "./site";

type SEOProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  keywords?: string[];
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image,
  type = "website",
  publishedTime,
  keywords = [],
}: SEOProps = {}): Metadata {
  const fullTitle = title ? `${title} — ${siteConfig.name}` : `${siteConfig.name} — ${siteConfig.tagline}`;
  const url = `${siteConfig.url}${path}`;
  // When no explicit image is passed, the app/opengraph-image.tsx convention
  // provides a dynamically generated OG image automatically.
  const images = image ? [{ url: image, width: 1200, height: 630, alt: siteConfig.name }] : undefined;

  return {
    title: fullTitle,
    description,
    keywords: [
      "дижитал агентлаг",
      "вэб хөгжүүлэлт",
      "AI чатбот",
      "автоматжуулалт",
      "Монгол",
      "Nuul Digital",
      ...keywords,
    ],
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      ...(publishedTime ? { publishedTime } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** JSON-LD Organization structured data. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Улаанбаатар",
      addressCountry: "MN",
    },
    sameAs: Object.values(siteConfig.social),
  };
}
