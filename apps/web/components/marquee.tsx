/* eslint-disable @next/next/no-img-element */

interface TechItem {
  name: string;
  slug?: string; // simpleicons.org slug (omit if no brand SVG exists)
  hex?: string;  // brand color, no leading #
}

// Curated stack — every slug verified against cdn.simpleicons.org
const tech: TechItem[] = [
  { name: "Next.js",      slug: "nextdotjs",    hex: "ffffff" },
  { name: "React",        slug: "react",        hex: "61DAFB" },
  { name: "TypeScript",   slug: "typescript",   hex: "3178C6" },
  { name: "Tailwind CSS", slug: "tailwindcss",  hex: "06B6D4" },
  { name: "Node.js",      slug: "nodedotjs",    hex: "5FA04E" },
  { name: "Prisma",       slug: "prisma",       hex: "ffffff" },
  { name: "PostgreSQL",   slug: "postgresql",   hex: "4169E1" },
  { name: "Supabase",     slug: "supabase",     hex: "3FCF8E" },
  { name: "Vercel",       slug: "vercel",       hex: "ffffff" },
  { name: "Cloudflare",   slug: "cloudflare",   hex: "F38020" },
  { name: "tRPC",         slug: "trpc",         hex: "398CCB" },
  { name: "Anthropic",    slug: "anthropic",    hex: "D97757" },
  { name: "OpenAI" }, // simpleicons removed in 2024; text-only
  { name: "Resend",       slug: "resend",       hex: "ffffff" },
  { name: "Stripe",       slug: "stripe",       hex: "635BFF" },
  { name: "GitHub",       slug: "github",       hex: "ffffff" },
  { name: "Figma",        slug: "figma",        hex: "F24E1E" },
  { name: "Hetzner",      slug: "hetzner",      hex: "D50C2D" },
  { name: "Turborepo",    slug: "turborepo",    hex: "EF4444" },
  { name: "pnpm",         slug: "pnpm",         hex: "F69220" },
];

export function Marquee() {
  // Render twice so the keyframe can translate -50% seamlessly
  const doubled = [...tech, ...tech];

  return (
    <section
      aria-label="Used technologies"
      className="relative z-[2] overflow-hidden border-y border-white/[0.05] bg-black/40 py-7"
    >
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-black to-transparent" />

      <div className="mb-4 flex justify-center">
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
          Бидний ашигладаг технологиуд
        </span>
      </div>

      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="group inline-flex items-center gap-2.5 px-8"
            title={item.name}
          >
            {item.slug && (
              <img
                src={`https://cdn.simpleicons.org/${item.slug}/${item.hex ?? "ffffff"}`}
                alt={item.name}
                width={20}
                height={20}
                loading="lazy"
                className="h-5 w-5 opacity-70 transition-opacity group-hover:opacity-100"
              />
            )}
            <span className="text-[13px] font-medium text-white/60 transition-colors group-hover:text-white">
              {item.name}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
