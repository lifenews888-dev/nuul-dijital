import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  /**
   * `@/` нь tsconfig-ийн paths-д байдаг ба `server/routers/*` түүгээр
   * импортлодог. Vite нь tsconfig-ийн paths-ийг өөрөө уншдаггүй тул энд
   * давтана — үгүй бол роутерын тест «Failed to load url @/lib/trpc»
   * гэж унана.
   */
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["lib/**/*.test.ts", "server/**/*.test.ts", "components/**/*.test.ts"],
  },
});
