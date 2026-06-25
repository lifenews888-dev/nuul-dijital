import { db } from "@/lib/db";

const API = "https://api.vercel.com";

export type VercelProject = { name: string; link: string };

/**
 * Lists projects from the configured Vercel account, returning each project's
 * name and best production link (custom domain when present, else *.vercel.app).
 * Requires VERCEL_API_TOKEN (and optionally VERCEL_TEAM_ID) in the environment.
 * Returns [] when no token is set so callers can degrade gracefully.
 */
export async function listVercelProjects(): Promise<VercelProject[]> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return [];
  const teamId = process.env.VERCEL_TEAM_ID;
  const out: VercelProject[] = [];
  let until: string | undefined;

  for (let page = 0; page < 20; page++) {
    const u = new URL(`${API}/v9/projects`);
    u.searchParams.set("limit", "100");
    if (teamId) u.searchParams.set("teamId", teamId);
    if (until) u.searchParams.set("until", until);

    const res = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[vercel] projects", res.status, await res.text().catch(() => ""));
      break;
    }
    const j = (await res.json()) as {
      projects?: { name: string; targets?: { production?: { alias?: string[]; url?: string } } }[];
      pagination?: { next?: number | null };
    };
    for (const p of j.projects ?? []) {
      const aliases = (p.targets?.production?.alias ?? []).filter(Boolean);
      const custom = aliases.find((a) => !a.endsWith(".vercel.app"));
      const host = custom ?? aliases[0] ?? p.targets?.production?.url ?? `${p.name}.vercel.app`;
      out.push({ name: p.name, link: `https://${host}` });
    }
    const next = j.pagination?.next;
    if (!next) break;
    until = String(next);
  }
  return out;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const screenshot = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;

// Don't import the agency's own site or dev worktrees.
const isExcluded = (name: string, link: string) =>
  /nuul-digital|nuul-mn|worktree/i.test(name) || /nuul\.digital/i.test(link);

const decodeHtml = (s: string) =>
  s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/g, "'")
    .replace(/\s+/g, " ").trim();

function metaTag(html: string, key: string, attr: "property" | "name"): string {
  const tag = html.match(new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*>`, "i"))?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decodeHtml(content) : "";
}

const GENERIC = /^(create next app|vercel|overview – vercel|home|index|react app|app|404|not found|)$/i;

/** Best-effort title/description from a live site, for nicer draft content. */
async function fetchSiteMeta(url: string): Promise<{ title: string; description: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 NuulBot" } });
    const html = (await res.text()).slice(0, 200000);
    const title =
      metaTag(html, "og:title", "property") ||
      decodeHtml(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
    const description = metaTag(html, "og:description", "property") || metaTag(html, "description", "name");
    return { title, description };
  } catch {
    return { title: "", description: "" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Imports new Vercel projects as DRAFT portfolio items (name + live link +
 * auto screenshot, enriched with the site's own title/description). Existing
 * slugs are skipped, so it's safe to re-run (used by the admin button and the
 * daily cron). Returns the number of newly created drafts.
 */
export async function importVercelProjectsAsDrafts(): Promise<number> {
  const projects = await listVercelProjects();
  const year = String(new Date().getFullYear());
  let created = 0;

  for (const p of projects) {
    if (!p.link || !p.name || isExcluded(p.name, p.link)) continue;
    // Dedup by the live link (stable identity) — a project may have been
    // imported earlier under a different display name / slug.
    if (await db.project.findFirst({ where: { link: p.link } })) continue;

    let slug = slugify(p.name);
    if (!slug) continue;
    // Avoid colliding with an unrelated existing slug.
    if (await db.project.findUnique({ where: { slug } })) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const meta = await fetchSiteMeta(p.link);
    const name = meta.title && !GENERIC.test(meta.title) && meta.title.length <= 70 ? meta.title : p.name;
    const description =
      meta.description.length >= 10
        ? meta.description.slice(0, 280)
        : "Vercel-ээс импортолсон төсөл. Тайлбар, салбар, үр дүнг нэмнэ үү.";

    await db.project.create({
      data: {
        slug, name, industry: "—", description,
        technologies: [], results: [], image: screenshot(p.link), gallery: [],
        link: p.link, year, services: [], featured: false, status: "DRAFT",
      },
    });
    created++;
  }
  return created;
}
