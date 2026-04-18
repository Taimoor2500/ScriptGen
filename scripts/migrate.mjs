#!/usr/bin/env node
/**
 * Applies lib/db/schema.pg.sql. Loads .env.local via Next's env loader.
 * Usage: npm run db:migrate
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;
const projectDir = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectDir);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required (set in .env.local or the environment).");
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: "require" });
const schema = readFileSync(join(projectDir, "lib/db/schema.pg.sql"), "utf8");

try {
  await sql.unsafe(schema);
  console.log("Schema applied successfully.");
} finally {
  await sql.end({ timeout: 5 });
}
