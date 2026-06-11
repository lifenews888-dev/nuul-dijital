/**
 * Role-Based Access Control for the Nuul Digital CMS.
 *
 * Resources are coarse capability groups; content entities (post/page/project/
 * caseStudy) share the `content` resource. Permissions are `resource:action`
 * strings with `*` wildcards.
 */

export type Role = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "USER";

export type Resource =
  | "content" // posts, pages, projects, case studies
  | "testimonials"
  | "team"
  | "faqs"
  | "jobs"
  | "site" // homepage stats / values / process steps
  | "media"
  | "leads" // leads + contacts + meetings
  | "activity"
  | "users"
  | "settings";

export type Action = "create" | "read" | "update" | "delete" | "publish" | "manage";

const PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "content:*",
    "testimonials:*",
    "team:*",
    "faqs:*",
    "jobs:*",
    "site:*",
    "media:*",
    "leads:*",
    "activity:read",
    "settings:*",
  ],
  EDITOR: [
    "content:create",
    "content:read",
    "content:update",
    "content:publish",
    "testimonials:*",
    "team:read",
    "faqs:*",
    "jobs:*",
    "site:*",
    "media:create",
    "media:read",
    "media:update",
    "leads:read",
    "activity:read",
  ],
  AUTHOR: [
    "content:create",
    "content:read",
    "content:update",
    "media:create",
    "media:read",
  ],
  USER: [],
};

export function can(role: Role | string | undefined, resource: Resource, action: Action): boolean {
  if (!role) return false;
  const perms = PERMISSIONS[role as Role];
  if (!perms) return false;
  return (
    perms.includes("*") ||
    perms.includes(`${resource}:*`) ||
    perms.includes(`${resource}:${action}`)
  );
}

/** Throws when the role lacks the permission — used to guard server actions. */
export function assertCan(role: Role | string | undefined, resource: Resource, action: Action) {
  if (!can(role, resource, action)) {
    throw new Error(`Forbidden: ${role ?? "anonymous"} cannot ${action} ${resource}`);
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Супер админ",
  ADMIN: "Админ",
  EDITOR: "Редактор",
  AUTHOR: "Зохиолч",
  USER: "Хэрэглэгч",
};

/** Ordered for privilege comparisons. */
export const ROLE_RANK: Record<Role, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  AUTHOR: 2,
  USER: 1,
};

/** Nav items each role may see — drives the admin sidebar. */
export function visibleSections(role: Role | string | undefined) {
  return {
    dashboard: true,
    content: can(role, "content", "read"),
    testimonials: can(role, "testimonials", "read"),
    team: can(role, "team", "read"),
    faqs: can(role, "faqs", "read"),
    jobs: can(role, "jobs", "read"),
    site: can(role, "site", "read"),
    media: can(role, "media", "read"),
    leads: can(role, "leads", "read"),
    activity: can(role, "activity", "read"),
    users: can(role, "users", "read"),
    settings: can(role, "settings", "read"),
  };
}
