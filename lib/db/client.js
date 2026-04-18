import { createRequire } from "node:module";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { logger } from "../logger.js";

// Vite/Vitest's transformer rewrites `import ... from "node:sqlite"` in ways
// that break resolution (it strips the `node:` prefix before requiring). We
// avoid it by going through a CJS `require`, which talks to Node directly.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite");

/**
 * We use Node 22's built-in `node:sqlite`. It's synchronous (like better-sqlite3)
 * and ships with the runtime — no native compile step required at deploy time.
 *
 * The API surface we rely on:
 *   db.exec(sql)
 *   db.prepare(sql).run(...args)   → { changes, lastInsertRowid }
 *   db.prepare(sql).get(...args)   → first row | undefined
 *   db.prepare(sql).all(...args)   → row[]
 *   db.close()
 */

/** @type {import('node:sqlite').DatabaseSync | null} */
let _db = null;

function resolveDbPath() {
  if (process.env.SCRIPTGEN_DB_PATH) return process.env.SCRIPTGEN_DB_PATH;
  return join(process.cwd(), "data", "scriptgen.db");
}

/**
 * Returns the shared sqlite handle. On first call, it creates the parent
 * directory if needed, opens the DB, enables foreign keys, and applies
 * schema.sql (idempotent — `CREATE ... IF NOT EXISTS`).
 */
export function getDb() {
  if (_db) return _db;

  const dbPath = resolveDbPath();
  const dir = dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const isNew = !existsSync(dbPath);
  const db = new DatabaseSync(dbPath);

  db.exec("PRAGMA foreign_keys = ON");

  const schemaPath = join(process.cwd(), "lib", "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  db.exec(schema);

  if (isNew) logger.info("db.created", { path: dbPath });
  else logger.info("db.opened", { path: dbPath });

  _db = db;
  return _db;
}

/**
 * Helper: run `fn` inside an IMMEDIATE transaction. Commits on success,
 * rolls back on throw. node:sqlite doesn't ship a transaction wrapper, so
 * we provide a tiny one here.
 *
 * @template T
 * @param {import('node:sqlite').DatabaseSync} db
 * @param {() => T} fn
 * @returns {T}
 */
export function withTransaction(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try { db.exec("ROLLBACK"); } catch {}
    throw err;
  }
}

/** Test-only — install a specific handle as the singleton. */
export function _setDbForTests(db) {
  _db = db;
}

/** Test-only — close + forget the singleton. */
export function _resetDbForTests() {
  if (_db) {
    try { _db.close(); } catch {}
    _db = null;
  }
}
