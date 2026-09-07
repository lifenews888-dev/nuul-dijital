import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // We intentionally scope file tracing to this project (multiple lockfiles exist on the machine).
  outputFileTracingRoot: process.cwd(),
  images: {
    formats: ["image/avif", "image/webp"],
    // Hostnames are listed rather than wildcarded to "**".
    //
    // The optimizer is NOT only reached for URLs an admin set, which is what
    // the wildcard assumed: /_next/image?url=... is a public GET endpoint and
    // does not check who supplied the URL. With "**" anyone could push
    // arbitrary images through this domain and bill the transformations to
    // this project.
    //
    // These five are every host actually serving an image on the public site.
    // Uploads through the CMS land in blob storage, so a new host is only
    // needed when an admin pastes a URL from somewhere else -- add it here
    // when that happens.
    remotePatterns: [
      // CMS uploads.
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      // Technology logos in the "trusted by" strip.
      { protocol: "https", hostname: "cdn.simpleicons.org" },
      // Stock photography: team, case-study covers. To be replaced with real
      // photography -- see the content work, not a reason to keep this open.
      { protocol: "https", hostname: "images.unsplash.com" },
      // Live screenshots standing in for project imagery.
      { protocol: "https", hostname: "api.microlink.io" },
      // Placeholder faces on the testimonials. Temporary.
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://plausible.io",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      // Video showcases: uploaded files stream from blob storage, and pasted
      // YouTube/Vimeo links render as embeds (VideoEmbed allows no other host).
      "media-src 'self' blob: https:",
      "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://plausible.io https://*.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
