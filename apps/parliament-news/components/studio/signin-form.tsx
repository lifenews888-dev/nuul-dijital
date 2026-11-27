"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Редакцын нэвтрэх форм.
 *
 * `redirect: false` — NextAuth өөрөө чиглүүлбэл алдааны мессеж нь URL-ийн
 * `?error=CredentialsSignIn` болж, хүн «Имэйл эсвэл нууц үг буруу байна»
 * гэсэн монгол тайлбарын оронд англи кодыг харна. Иймд өөрсдөө шийднэ.
 *
 * `callbackUrl` нь СЕРВЕРТ `safeCallbackUrl`-ээр цэвэрлэгдсэн байна —
 * энэ компонент түүнийг дахин шалгахгүй, зөвхөн дамжуулна.
 */
export function SigninForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.ok) {
      /** Серверийн бүрхүүл шинэ сесстэйгээр дахин зурагдах ёстой */
      router.replace(callbackUrl);
      router.refresh();
      return;
    }

    /**
     * Нууц үгийг ХЭЗЭЭ Ч лог хийхгүй — консолд ч, Sentry-д ч.
     * `res.error` нь `authOptions`-ийн `authorize`-ийн монгол мессеж.
     */
    setError(res?.error || "Нэвтэрч чадсангүй. Дахин оролдоно уу.");
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate={false}>
      <label className="flex flex-col gap-1.5">
        <span className="font-head text-sm font-semibold text-muted">Имэйл</span>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          autoFocus
          dir="ltr"
          className="h-11 rounded-lg border border-line bg-inp px-3 text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-head text-sm font-semibold text-muted">Нууц үг</span>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          dir="ltr"
          className="h-11 rounded-lg border border-line bg-inp px-3 text-base text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        />
      </label>

      {/* Алдаа нь дэлгэц уншигчид ч хүрнэ — зөвхөн өнгө биш */}
      <p
        role="alert"
        aria-live="polite"
        className={error ? "font-head text-sm font-semibold text-red" : "sr-only"}
      >
        {error ?? ""}
      </p>

      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-lg bg-cob font-head text-base font-bold text-paper disabled:opacity-60"
      >
        {busy ? "Нэвтэрч байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
