import type { Config } from "tailwindcss";

/**
 * Өнгө нь `app/globals.css`-ийн токенуудаас ирнэ — энд hex давтахгүй.
 * Ингэснээр цайвар/бараан сонголт нэг газраас удирдагдана.
 *
 * Хуучин `brand`/`accent` хасагдсан: `site-v2`-ийн токен нь цорын гагц эх
 * сурвалж. Хоёр өнгөний систем зэрэгцэж байвал хойшид зөрнө.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        sheet: "var(--sheet)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        cob: "var(--cob)",
        red: "var(--red)",
      },
      borderColor: {
        rule: "var(--rule)",
      },
      fontFamily: {
        head: ["var(--font-head)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
        title: ["var(--font-title)", "Georgia", "serif"],
      },
      maxWidth: {
        page: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;
