"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Алдаа гарлаа. Дахин оролдоно уу.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 font-dm">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <BrandLogo className="font-syne text-3xl font-bold text-v" suffixClassName="text-txt" />
          </Link>
          <p className="mt-3 text-txt-2">Нууц үг сэргээх</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-8">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-v/10">
                <svg className="h-8 w-8 text-v" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 font-syne text-lg font-bold text-txt">Имэйл илгээлээ!</h3>
              <p className="mb-6 text-sm text-txt-2">
                Шуудангаа шалгана уу. Нууц үг сэргээх линк илгээлээ.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block rounded-xl bg-v px-6 py-3 text-sm font-semibold text-white transition hover:bg-v-dark"
              >
                Нэвтрэх хуудас руу буцах
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-txt-2">
                Бүртгэлтэй имэйл хаягаа оруулна уу. Бид нууц үг сэргээх линк илгээх болно.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-txt-2">
                    Имэйл
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.04] bg-bg-3 px-4 py-3 text-sm text-txt placeholder-txt-3 outline-none transition focus:border-v/40 focus:ring-1 focus:ring-v/20"
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-v py-3 text-sm font-semibold text-white transition hover:bg-v-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Илгээж байна..." : "Илгээх"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-txt-3">
          <Link href="/auth/signin" className="font-medium text-v transition hover:text-v-soft">
            ← Нэвтрэх хуудас руу буцах
          </Link>
        </p>
      </div>
    </div>
  );
}
