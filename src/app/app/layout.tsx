import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAppContext } from "@/lib/app";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account — Nuul Digital",
  robots: { index: false, follow: false },
};

const STAFF_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"]);

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (role && STAFF_ROLES.has(role)) {
    redirect("/admin");
  }

  const ctx = await getAppContext();

  if (!ctx) {
    return <>{children}</>;
  }

  return (
    <AppShell userEmail={ctx.user.email} orgName={ctx.organization.name}>
      {children}
    </AppShell>
  );
}