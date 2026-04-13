import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@lantern/contracts": path.resolve(import.meta.dirname, "packages/contracts/src/index.ts"),
      "@lantern/db": path.resolve(import.meta.dirname, "packages/db/src/index.ts"),
      "@lantern/terminal-ui": path.resolve(import.meta.dirname, "packages/terminal-ui/src/index.ts")
    }
  },
  test: {
    environment: "node",
    include: [
      "scripts/**/*.test.ts",
      "packages/**/*.test.ts",
      "services/**/*.test.ts"
    ]
  }
});
