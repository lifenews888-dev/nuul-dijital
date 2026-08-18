import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Wrapper for a project card's clickable surface.
 *
 * When an admin fills in the project's "Вэб холбоос" (`link`) field, the card
 * points at that URL instead of the generated /portfolio/[slug] page; absolute
 * URLs open in a new tab. Projects without a link keep the detail page, so the
 * prerendered routes stay reachable and indexable.
 */
export function ProjectCardLink({
  project,
  className,
  children,
}: {
  project: { slug: string; link?: string };
  className?: string;
  children: ReactNode;
}) {
  const href = project.link?.trim();

  if (href && /^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href || `/portfolio/${project.slug}`} className={className}>
      {children}
    </Link>
  );
}
