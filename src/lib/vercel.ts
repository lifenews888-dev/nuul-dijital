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
