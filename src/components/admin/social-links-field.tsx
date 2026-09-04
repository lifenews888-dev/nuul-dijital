"use client";

import { useState } from "react";
import {
  Facebook,
  Github,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * The networks a profile can carry. The keys are what gets stored, so the
 * public side can look them up without guessing.
 */
export const SOCIAL_NETWORKS: { key: string; label: string; icon: LucideIcon; placeholder: string }[] =
  [
    { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/…" },
    { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/…" },
    { key: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/in/…" },
    { key: "twitter", label: "X (Twitter)", icon: Twitter, placeholder: "https://x.com/…" },
    { key: "youtube", label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@…" },
    { key: "github", label: "GitHub", icon: Github, placeholder: "https://github.com/…" },
    { key: "website", label: "Вэбсайт", icon: Globe, placeholder: "https://…" },
  ];

/**
 * Replaces the raw JSON textarea with one input per network.
 *
 * The value is still submitted as JSON in a hidden field, so the server action
 * parses it exactly as before — only the editing surface changed.
 */
export function SocialLinksField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  /** Existing value, as stored: a { network: url } object (or null). */
  defaultValue?: unknown;
}) {
  const initial =
    defaultValue && typeof defaultValue === "object" && !Array.isArray(defaultValue)
      ? (defaultValue as Record<string, unknown>)
      : {};

  const [links, setLinks] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      SOCIAL_NETWORKS.map((n) => [n.key, typeof initial[n.key] === "string" ? String(initial[n.key]) : ""])
    )
  );

  // Only non-empty entries are stored, so an untouched profile stays clean.
  const filled = Object.fromEntries(
    Object.entries(links).filter(([, v]) => v.trim().length > 0)
  );

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-foreground/90">{label}</span>
      <input
        type="hidden"
        name={name}
        value={Object.keys(filled).length ? JSON.stringify(filled) : ""}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {SOCIAL_NETWORKS.map((n) => (
          <label key={n.key} className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground">
              <n.icon className="size-4" />
            </span>
            <Input
              value={links[n.key] ?? ""}
              onChange={(e) => setLinks((prev) => ({ ...prev, [n.key]: e.target.value }))}
              placeholder={n.placeholder}
              aria-label={n.label}
              type="url"
            />
          </label>
        ))}
      </div>

      <span className="text-xs text-muted-foreground">
        Бөглөсөн холбоос нь профайл дээр дүрсээр харагдана. Хоосон талбар хадгалагдахгүй.
      </span>
    </div>
  );
}
