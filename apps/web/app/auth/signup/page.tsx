"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (password.length < 8) {
      return "Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой";
    }
    if (password !== confirmPassword) {
      return "Нууц үг таарахгүй байна";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Бүртгэл үүсгэхэд алдаа гарлаа");
        return;
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Бүртгэл амжилттай. Нэвтрэхэд алдаа гарлаа.");
      } else {
        window.location.href = "/dashboard";
      }
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
          <p className="mt-3 text-txt-2">Шинэ бүртгэл үүсгэх</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.04] bg-bg-2 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-txt-2">
                Нэр
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.04] bg-bg-3 px-4 py-3 text-sm text-txt placeholder-txt-3 outline-none transition focus:border-v/40 focus:ring-1 focus:ring-v/20"
                placeholder="Таны нэр"
                required
              />
            </div>

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

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-txt-2">
                Нууц үг
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
              {loading ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-txt-3">
          Бүртгэлтэй юу?{" "}
          <Link href="/auth/signin" className="font-medium text-v transition hover:text-v-soft">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </div>
  );
}
