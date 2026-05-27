"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: "Сул", color: "bg-red-500" };
  if (score <= 3) return { level: 2, label: "Дунд", color: "bg-yellow-500" };
  return { level: 3, label: "Хүчтэй", color: "bg-green-500" };
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой");
      return;
    }

    if (password !== confirmPassword) {
      setError("Нууц үг таарахгүй байна");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 font-dm">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mb-2 font-syne text-lg font-bold text-txt">Линк буруу байна</h3>
            <p className="mb-6 text-sm text-txt-2">Нууц үг сэргээх линк олдсонгүй.</p>
            <Link
              href="/auth/forgot-password"
              className="inline-block rounded-xl bg-v px-6 py-3 text-sm font-semibold text-white transition hover:bg-v-dark"
            >
              Дахин линк авах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 font-dm">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <BrandLogo className="font-syne text-3xl font-bold text-v" suffixClassName="text-txt" />
          </Link>
          <p className="mt-3 text-txt-2">Шинэ нууц үг тохируулах</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-8">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mb-2 font-syne text-lg font-bold text-txt">Нууц үг амжилттай шинэчлэгдлээ!</h3>
              <p className="mb-6 text-sm text-txt-2">Та одоо шинэ нууц үгээрээ нэвтрэх боломжтой.</p>
              <Link
                href="/auth/signin"
                className="inline-block rounded-xl bg-v px-6 py-3 text-sm font-semibold text-white transition hover:bg-v-dark"
              >
                Нэвтрэх
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-txt-2">
                  Шинэ нууц үг
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.04] bg-bg-3 px-4 py-3 text-sm text-txt placeholder-txt-3 outline-none transition focus:border-v/40 focus:ring-1 focus:ring-v/20"
                  placeholder="Хамгийн багадаа 8 тэмдэгт"
                  required
                  minLength={8}
                />
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= strength.level ? strength.color : "bg-white/[0.06]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`mt-1 text-xs ${
                      strength.level === 1 ? "text-red-400" :
                      strength.level === 2 ? "text-yellow-400" :
                      "text-green-400"
                    }`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-txt-2">
                  Нууц үг давтах
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.04] bg-bg-3 px-4 py-3 text-sm text-txt placeholder-txt-3 outline-none transition focus:border-v/40 focus:ring-1 focus:ring-v/20"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-v py-3 text-sm font-semibold text-white transition hover:bg-v-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
              </button>
            </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
