import postgres from "postgres";
import { ConfigError } from "../errors.js";

/**
 * Shared postgres.js client for Neon (`DATABASE_URL`). Tagged templates are
 * parameterized; use `sql.begin()` for transactions (see searches.js).
 */

/** @type {ReturnType<typeof postgres> | null} */
let _sql = null;

/**
 * @returns {ReturnType<typeof postgres>}
 */
export function getSql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new ConfigError(
      "Server is missing DATABASE_URL. Set it to your Neon connection string.",
      "missing_database_url"
    );
  }
  _sql = postgres(url, {
    ssl: "require",
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return _sql;
}

/** @internal Test-only — replace the singleton. */
export function _setSqlForTests(sql) {
  _sql = sql;
}

/** @internal Test-only — close and clear the singleton. */
export async function _resetSqlForTests() {
  if (_sql) {
    try {
      await _sql.end({ timeout: 5 });
    } catch {
      /* ignore */
    }
    _sql = null;
  }
}
