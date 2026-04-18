import { getSql, _resetSqlForTests } from "../../lib/db/client.js";

/**
 * Truncates all app tables (requires DATABASE_URL and applied schema).
 */
export async function resetTestTables() {
  const sql = getSql();
  await sql`TRUNCATE TABLE sessions, searches, users RESTART IDENTITY CASCADE`;
}

/** Disconnects the pooled client (e.g. after a test file). */
export async function closeTestDb() {
  await _resetSqlForTests();
}
