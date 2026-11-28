/**
 * Сошиал шигтгээний ЦАГААН ЖАГСААЛТ.
 *
 * Шигтгээ нь гуравдагч этгээдийн кодыг манай хуудсанд `<iframe>`-ээр
 * оруулна. Тиймээс хаяг бүрийг хост нэрээр нь ЯГ тулгана — регексээр
 * «агуулж байна уу» гэж шалгавал `youtube.com.evil.mn` нэвтэрнэ.
 * `URL` задлагч нь hostname-ийг хуурахгүйгээр өгнө.
 */

export type EmbedHost = "youtube" | "x" | "facebook";

export type Embed = {
  host: EmbedHost;
  /** `<iframe src>`-д тавих бэлэн хаяг */
  src: string;
  /** `aspect-ratio` — CSS-ийн бичлэгээр */
  ratio: string;
};

const YOUTUBE = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const X = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);
const FACEBOOK = new Set(["facebook.com", "www.facebook.com", "web.facebook.com", "fb.watch"]);

/** YouTube-ийн видеоны дугаар — гурван хэлбэрээс */
function youtubeId(u: URL): string | null {
  if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
  const v = u.searchParams.get("v");
  if (v) return v;
  const m = /^\/embed\/([^/]+)/.exec(u.pathname);
  return m ? m[1] : null;
}

export function parseEmbed(url: string): Embed | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  /** Зөвхөн https: `http` нь замдаа өөрчлөгдөж болох контентыг манай нэрээр зурна. */
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();

  if (YOUTUBE.has(host)) {
    const id = youtubeId(u);
    return id ? { host: "youtube", src: `https://www.youtube.com/embed/${id}`, ratio: "16/9" } : null;
  }

  if (X.has(host)) {
    const m = /\/status\/(\d+)/.exec(u.pathname);
    return m
      ? {
          host: "x",
          src: `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}`,
          ratio: "4/5",
        }
      : null;
  }

  if (FACEBOOK.has(host)) {
    return {
      host: "facebook",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u.toString())}&show_text=false`,
      ratio: "16/9",
    };
  }

  return null;
}
