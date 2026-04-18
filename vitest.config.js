import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

// Next's loadEnvConfig skips `.env.local` when NODE_ENV=test; load it for DB tests.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  test: {
    testTimeout: 30_000,
    include: ["tests/**/*.test.js"],
    environment: "node",
    clearMocks: true,
    // Run each test file in a real Node subprocess (not Vite's bundler).
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
