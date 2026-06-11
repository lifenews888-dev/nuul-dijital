import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0A0A0A",
          backgroundImage:
            "radial-gradient(ellipse at top right, rgba(37,99,235,0.35), transparent 55%), radial-gradient(ellipse at bottom left, rgba(6,182,212,0.25), transparent 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="72" height="72" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="og-g" x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2563EB" />
                <stop offset="1" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="40" height="40" rx="10.5" fill="url(#og-g)" />
            <path
              d="M12 29V12L28 29V12"
              stroke="white"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="28" cy="12" r="2.6" fill="white" />
          </svg>
          <div style={{ fontSize: 36, fontWeight: 700 }}>nuul digital</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <span>Монголын дижитал</span>
            <span>ирээдүйг бүтээнэ</span>
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.6)" }}>
            Вэб · AI · Автоматжуулалт · E-commerce · Дизайн
          </div>
        </div>
      </div>
    ),
    size
  );
}
