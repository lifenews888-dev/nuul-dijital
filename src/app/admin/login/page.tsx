"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo";
import { GradientMesh } from "@/components/shared/gradient-mesh";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) router.push(callbackUrl);
    else setError(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-3xl border border-white/10 bg-card p-8"
    >
      <div className="flex flex-col items-center text-center">
        <LogoMark size={44} />
        <h1 className="mt-5 text-2xl font-bold">Админд нэвтрэх</h1>
        <p className="mt-1 text-sm text-muted-foreground">Nuul Digital удирдлагын самбар</p>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Имэйл</Label>
          <Input id="email" name="email" type="email" required placeholder="admin@nuul.digital" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Нууц үг</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        {error && (
          <p className="flex items-center gap-2 text-sm text-error">
            <AlertCircle className="size-4" /> Имэйл эсвэл нууц үг буруу байна.
          </p>
        )}
        <Button type="submit" variant="gradient" size="lg" disabled={loading} className="mt-2">
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <Lock className="size-4" /> Нэвтрэх
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <GradientMesh />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
