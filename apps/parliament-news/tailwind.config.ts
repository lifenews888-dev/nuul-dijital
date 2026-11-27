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
        /*
         * Студийн нэмэлтүүд. Утга нь `app/studio.css`-д `.studio` дээр
         * тавигдана — нийтийн хуудсанд эдгээр токен БАЙХГҮЙ, тиймээс
         * эндээс өнгө нийтийн хуудсанд гоожиж чадахгүй.
         */
        pan: "var(--pan)",
        line: "var(--line)",
        soft: "var(--soft)",
        rail: "var(--rail)",
        inp: "var(--inp)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        /**
         * Сувгаар — `border-rule/20` зэрэг alpha-тай хувилбар ажиллахын тулд.
         * Өмнө нь `borderColor: { rule: "var(--rule)" }` байсан: Tailwind
         * тунгалаг `var()`-д alpha шургуулж чаддаггүй тул `/NN`-тэй 11
         * хэрэглээ БҮГД хаягдаж, preflight-ийн саарал шугам гарч байв.
         */
        rule: "rgb(var(--rule-rgb) / <alpha-value>)",
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
