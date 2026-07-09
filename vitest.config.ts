import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "packages/*/tests/**/*.test.ts"],
    coverage: {
      include: [
        "packages/eyslie/src/**/*.ts",
        "packages/materials-actually/src/**/*.ts",
        "src/shared/lib/scale.ts",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
