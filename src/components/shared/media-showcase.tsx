import Image from "next/image";
import { VideoEmbed } from "@/components/shared/video-embed";

/**
 * Presentation media for a catalogue entry: a lead image, a video, and a
 * gallery — in that order, each shown only when it exists.
 *
 * Renders nothing at all when an entry has no media, so an entry that has not
 * been given any does not leave an empty frame on the page.
 */
export function MediaShowcase({
  image,
  gallery,
  videoUrl,
  title,
  className,
}: {
  image?: string | null;
  gallery?: string[] | null;
  videoUrl?: string | null;
  title: string;
  className?: string;
}) {
  const shots = (gallery ?? []).filter(Boolean);
  if (!image && !videoUrl && shots.length === 0) return null;

  return (
    <div className={className ?? "flex flex-col gap-5"}>
      {image && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-white/10">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        </div>
      )}

      {videoUrl && <VideoEmbed url={videoUrl} title={`${title} — видео танилцуулга`} />}

      {shots.length > 0 && (
        <div className={shots.length === 1 ? "" : "grid gap-4 sm:grid-cols-2"}>
          {shots.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10"
            >
              <Image
                src={src}
                alt={`${title} ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
