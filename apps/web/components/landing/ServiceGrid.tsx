"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ServiceItem {
  name: string;
  desc: string;
  tag: string;
  featureKey?: string;
  comingSoon?: boolean;
  externalUrl?: string;
  iconBg: string;
  iconBorder: string;
  tagBg: string;
  tagColor: string;
  glow: string;
  icon: React.ReactNode;
}

export function ServiceGrid({ services }: { services: ServiceItem[] }) {
  const [features, setFeatures] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/settings/features")
      .then((r) => r.json())
      .then((d) => { if (d.features) setFeatures(d.features); })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl border border-[--bdv] md:grid-cols-3">
      {services.map((svc) => {
        const fStatus = svc.featureKey ? features[svc.featureKey] : undefined;
        const isComingSoon = svc.comingSoon === true || fStatus === "coming_soon";
        const isDisabled = fStatus === "false";

        if (isDisabled) return null;

        const cardContent = (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#7B6FFF08] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div
              className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border transition-all group-hover:scale-105"
              style={{ background: svc.iconBg, borderColor: svc.iconBorder }}
            >
              {svc.icon}
            </div>

            {isComingSoon && (
              <div className="absolute right-4 top-4 rounded-full bg-[#FFB02E]/15 px-2.5 py-1 text-[10px] font-bold text-[#FFB02E]">
                Тун удахгүй
              </div>
            )}

            {!isComingSoon && (
              <svg
                className="svc-arrow absolute right-8 top-8 h-5 w-5 text-txt-3 opacity-0 transition-all"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}

            <div className="mb-2 font-syne text-xl font-semibold tracking-tight">
              {svc.name}
            </div>
            <div className="mb-4 text-[13px] leading-relaxed text-txt-2">
              {svc.desc}
            </div>
            <span
              className="inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: svc.tagBg, color: svc.tagColor }}
            >
              {svc.tag}
            </span>
          </>
        );

        const cardClasses = `group relative overflow-hidden bg-bg-2 p-8 transition-colors ${
          isComingSoon ? "opacity-60" : "cursor-pointer hover:bg-bg-3"
        }`;

        if (!isComingSoon && svc.externalUrl) {
          return (
            <a
              key={svc.name}
              href={svc.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cardClasses}
            >
              {cardContent}
            </a>
          );
        }

        return (
          <div key={svc.name} className={cardClasses}>
            {cardContent}
          </div>
        );
      })}
    </div>
  );
}
