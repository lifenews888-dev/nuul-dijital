import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Nuul Digital — Migration Mark favicon (rendered to PNG at build).
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <svg width="64" height="64" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="40" height="40" rx="10.5" fill="url(#g)" />
          <path
            d="M12 29V12L28 29V12"
            stroke="white"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="28" cy="12" r="2.6" fill="white" />
        </svg>
      </div>
    ),
    size
  );
}
