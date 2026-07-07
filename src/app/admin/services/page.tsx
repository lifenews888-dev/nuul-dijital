import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminServicesPage() {
  redirect("/admin/services/orders");
}