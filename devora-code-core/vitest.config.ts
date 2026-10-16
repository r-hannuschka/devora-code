import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@/core": resolve(import.meta.dirname, "src/core"),
      "@/domain": resolve(import.meta.dirname, "src/domain"),
      "@/infrastructure": resolve(import.meta.dirname, "src/infrastructure"),
      "@/util": resolve(import.meta.dirname, "src/util"),
      "@src": resolve(import.meta.dirname, "src"),
      "@/tests/core": resolve(import.meta.dirname, "tests/core"),
      vscode: resolve(import.meta.dirname, "tests/mocks/vscode.ts"),
    },
    extensions: [".ts", ".js"],
  },
});
