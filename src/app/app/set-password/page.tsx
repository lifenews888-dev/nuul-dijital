import { Suspense } from "react";

import { AppSetPasswordForm } from "@/components/app/app-set-password-form";

export const dynamic = "force-dynamic";

export default function AppSetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AppSetPasswordForm mode="reset" />
    </Suspense>
  );
}