import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Wrapper for a project card's clickable surface.
 *
 * Cards always lead to the project's own page. They used to jump straight to
 * the client's live site whenever an admin filled in "Вэб холбоос", which had
 * two costs: every /portfolio/[slug] page was orphaned -- prerendered and
 * listed in the sitemap, but with no link anywhere on the site pointing at it,
 * since the showcase, the portfolio grid and the industry pages all render
 * through here -- and the visitor was handed off to someone else's site before
 * reading a word about the work.
 *
 * The live site is still one click away, from a button on the project page.
 */
export function ProjectCardLink({
  project,
  className,
  children,
}: {
  project: { slug: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={`/portfolio/${project.slug}`} className={className}>
      {children}
    </Link>
  );
}
