"use client";

import { signOut } from "next-auth/react";

/**
 * Эрхгүй хүний цорын нэг гарц.
 *
 * Самбарын «Гарах» товч нь тэр хүн хүрч чадахгүй хуудсанд байдаг:
 * нэвтэрсэн ч гишүүн биш хүн нэвтрэх хуудсанд гацна. Өөр сесстэйгээр
 * оролдохын тулд энэ товч хэрэгтэй.
 */
export function SignoutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/studio/signin" })}
      className="h-11 rounded-lg border border-line bg-pan px-4 font-head text-sm font-semibold text-ink hover:bg-soft"
    >
      {label}
    </button>
  );
}
