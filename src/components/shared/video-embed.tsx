/**
 * Resolves a pasted video link into something we can actually render.
 *
 * YouTube and Vimeo become privacy-friendly embeds; a direct file plays
 * natively. Anything else falls back to a plain link rather than an iframe, so
 * a mistyped URL cannot smuggle an arbitrary frame onto the page.
 */
export type ResolvedVideo =
  | { kind: "youtube" | "vimeo"; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

const FILE_EXT = /\.(mp4|webm|ogg|mov)(\?|$)/i;

export function resolveVideo(raw: string): ResolvedVideo | null {
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop();
    if (id) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    if (id) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) return { kind: "vimeo", src: `https://player.vimeo.com/video/${id}` };
  }
  if (FILE_EXT.test(url.pathname)) return { kind: "file", src: url.toString() };

  return { kind: "link", src: url.toString() };
}

export function VideoEmbed({ url, title }: { url?: string | null; title: string }) {
  const video = url ? resolveVideo(url) : null;
  if (!video) return null;

  if (video.kind === "link") {
    return (
      <a
        href={video.src}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        Видео танилцуулга үзэх
      </a>
    );
  }

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black">
      {video.kind === "file" ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={video.src} controls preload="metadata" className="size-full object-contain">
          Таны браузер видео тоглуулахыг дэмжихгүй байна.
        </video>
      ) : (
        <iframe
          src={video.src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      )}
    </div>
  );
}
