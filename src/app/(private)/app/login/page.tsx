import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppLoginForm } from "@/components/app/app-login-form";
import { getAppUser } from "@/lib/app";

export const dynamic = "force-dynamic";

export default async function AppLoginPage() {
  const user = await getAppUser();
  if (user) redirect("/app");

  return (
    <Suspense fallback={null}>
      <AppLoginForm />
    </Suspense>
  );
}