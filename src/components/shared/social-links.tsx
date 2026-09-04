import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

/** Mirrors the keys the admin's SocialLinksField writes. */
const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  facebook: { icon: Facebook, label: "Facebook" },
  instagram: { icon: Instagram, label: "Instagram" },
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  twitter: { icon: Twitter, label: "X" },
  youtube: { icon: Youtube, label: "YouTube" },
  github: { icon: Github, label: "GitHub" },
  website: { icon: Globe, label: "Вэбсайт" },
};

/** Renders the social links a profile carries; nothing at all when it has none. */
export function SocialLinks({
  links,
  name,
  className,
}: {
  links?: Record<string, string>;
  /** Whose profile it is — used to keep the links distinguishable to screen readers. */
  name?: string;
  className?: string;
}) {
  const entries = Object.entries(links ?? {}).filter(
    ([key, url]) => ICONS[key] && typeof url === "string" && url.trim().length > 0
  );
  if (!entries.length) return null;

  return (
    <div className={className ?? "mt-3 flex items-center justify-center gap-1.5"}>
      {entries.map(([key, url]) => {
        const { icon: Icon, label } = ICONS[key];
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={name ? `${name} — ${label}` : label}
            className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
          >
            <Icon className="size-3.5" />
          </a>
        );
      })}
    </div>
  );
}
