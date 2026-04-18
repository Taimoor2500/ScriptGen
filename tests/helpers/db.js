import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { _setDbForTests, _resetDbForTests } from "../../lib/db/client.js";

const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite");

/**
 * Creates a pristine in-memory sqlite DB with the schema applied, installs
 * it as the module-level singleton, and returns the handle. Tests call this
 * in `beforeEach` so every test gets an isolated fresh DB.
 */
export function freshTestDb() {
  _resetDbForTests();
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const schema = readFileSync(
    join(process.cwd(), "lib", "db", "schema.sql"),
    "utf8"
  );
  db.exec(schema);
  _setDbForTests(db);
  return db;
}

export function closeTestDb() {
  _resetDbForTests();
}
