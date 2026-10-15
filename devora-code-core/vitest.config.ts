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
      "@/modules": resolve(import.meta.dirname, "src/modules"),
      "@/util": resolve(import.meta.dirname, "src/util"),
      // nur für Tests: Zugriff auf Interna ohne Barrel (siehe tests/tsconfig.json)
      "@src": resolve(import.meta.dirname, "src"),
      "@/tests/core": resolve(import.meta.dirname, "tests/core"),
      // "vscode" gibt es nur im Extension Host
      vscode: resolve(import.meta.dirname, "tests/mocks/vscode.ts"),
    },
    extensions: [".ts", ".js"],
  },
});
