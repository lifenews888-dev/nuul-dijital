import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Domains admin hub — orders queue is the primary view (PR 10 expands this). */
export default function AdminDomainsPage() {
  redirect("/admin/domains/orders");
}