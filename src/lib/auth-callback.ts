/** Restrict post-login redirects to same-site relative paths. */
export function safeCallbackUrl(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  if (!url.startsWith("/") || url.startsWith("//")) return fallback;
  return url;
}