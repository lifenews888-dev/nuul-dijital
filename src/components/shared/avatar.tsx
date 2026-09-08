import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Hosts that hand out a picture of *someone else*.
 *
 * i.pravatar.cc invents a face on request; images.unsplash.com is stock
 * photography. Either can illustrate a page perfectly well, but neither can
 * ever be a photograph of the named person, and putting one beside a real name
 * and job title states something untrue about who works here. Treated as "no
 * photo", so the initials show instead.
 *
 * A file uploaded through the CMS lands in blob storage and renders normally,
 * so replacing these with real photographs needs no code change.
 */
const STOCK_AVATAR_HOSTS = [
  "pravatar.cc",
  "i.pravatar.cc",
  "images.unsplash.com",
  "unsplash.com",
  "placekitten.com",
  "thispersondoesnotexist.com",
];

export function isPhotograph(url: string | undefined | null): url is string {
  if (!url) return false;
  try {
    return !STOCK_AVATAR_HOSTS.includes(new URL(url).hostname);
  } catch {
    // Not a URL we can read: show initials rather than a broken image.
    return false;
  }
}

/** "Б. Энхбаяр" -> "БЭ". One letter for a single-word name. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!)
    .join("")
    .toUpperCase();
}

/**
 * A person's avatar: their photograph when there is a real one, their initials
 * otherwise.
 *
 * `className` sizes and shapes the box — both a round 56px testimonial portrait
 * and a large rounded team tile are square boxes the image fills, so the shape
 * belongs to the caller.
 */
export function Avatar({
  src,
  name,
  className,
  imageClassName,
  sizes = "96px",
}: {
  src?: string | null;
  name: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
}) {
  if (isPhotograph(src)) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
        />
      </div>
    );
  }

  return (
    <div
      // The name is always rendered next to this, so the initials are
      // decoration rather than information a screen reader needs twice.
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center bg-accent/10 font-semibold tracking-wide text-accent",
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
