import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "lib/api-helpers.ts",
        "lib/oxatis-api.ts",
        "app/api/oxatis/fetch-articles/utils.ts",
        "app/api/oxatis/fetch-site-stock/utils.ts",
        "app/articles/utils/articleFilters.ts",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
