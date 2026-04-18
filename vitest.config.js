import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    environment: "node",
    clearMocks: true,
    // Run each test file in a real Node subprocess (not Vite's bundler) so
    // `node:sqlite` and other node: built-ins resolve natively.
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
