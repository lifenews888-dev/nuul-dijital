import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Nuul.digital — Монголын дижитал маркетинг агентлаг";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(ellipse at 20% 30%, #7B6FFF40 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #00E5B830 0%, transparent 50%), #0A0814",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #7B6FFF, #00E5B8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 800,
              color: "#0A0814",
            }}
          >
            N
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px" }}>
            Nuul.digital
          </div>
        </div>

        {/* Center: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-3px",
              maxWidth: "950px",
            }}
          >
            Бизнесээ дижитал ертөнцөд{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #A89FFF, #00E5B8)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              өсгөнө
            </span>
            .
          </div>
          <div
            style={{
              fontSize: "30px",
              color: "#B8B5C8",
              maxWidth: "880px",
              lineHeight: 1.4,
            }}
          >
            Дижитал маркетинг · FB контент · Вэбсайт · AI чатбот
          </div>
        </div>

        {/* Bottom: chips */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {["ROI 3-5x", "94% автомат", "Монгол хэлээр 24/7", "Шударга үнэ"].map((chip) => (
            <div
              key={chip}
              style={{
                fontSize: "22px",
                padding: "12px 24px",
                borderRadius: "999px",
                border: "1px solid #7B6FFF40",
                background: "#7B6FFF15",
                color: "#A89FFF",
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
