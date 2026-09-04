import { getSessionUser } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";

// Admin is always rendered at request time (reads the live DB + session).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Nuul Digital",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  // Unauthenticated visitors only reach /admin/login (enforced by middleware);
  // render it without the dashboard chrome.
  if (!user) return <>{children}</>;

  return <AdminShell user={user}>{children}</AdminShell>;
}
