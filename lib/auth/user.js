import { getDb } from "../db/client.js";
import { hashPassword, verifyPassword } from "./password.js";
import { ValidationError } from "../errors.js";

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {number} created_at
 */

/** Strips the password hash before returning a user to any caller. */
function publicUser(row) {
  if (!row) return null;
  return { id: row.id, email: row.email, created_at: row.created_at };
}

/**
 * Create a user account. Throws ValidationError("Email already registered.")
 * on unique-constraint collision so the route can render a 409/400 cleanly.
 *
 * @param {string} email
 * @param {string} password
 * @param {object} [deps]
 * @returns {Promise<User>}
 */
export async function createUser(email, password, { db = getDb(), now = Date.now } = {}) {
  const normalized = email.trim().toLowerCase();
  const hash = await hashPassword(password);
  const createdAt = now();

  try {
    const info = db
      .prepare(
        `INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)`
      )
      .run(normalized, hash, createdAt);
    const newId = Number(info.lastInsertRowid);
    return publicUser(
      db.prepare(`SELECT id, email, created_at FROM users WHERE id = ?`).get(newId)
    );
  } catch (err) {
    // node:sqlite raises messages like "UNIQUE constraint failed: users.email".
    // better-sqlite3 used the same string. Be lenient (case-insensitive) so
    // we don't regress if the runtime tweaks the phrasing later.
    const msg = String(err?.message || "");
    if (/unique constraint/i.test(msg)) {
      throw new ValidationError("Email already registered.", "email_taken");
    }
    throw err;
  }
}

/**
 * Verify email+password. Returns User on success, null on any failure
 * (no user, wrong password). Callers should not distinguish the two — that
 * leaks which emails are registered.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User | null>}
 */
export async function authenticate(email, password, { db = getDb() } = {}) {
  const normalized = email.trim().toLowerCase();
  const row = db
    .prepare(`SELECT id, email, password_hash, created_at FROM users WHERE email = ?`)
    .get(normalized);
  if (!row) {
    // Still do a bcrypt compare against a dummy hash so timing doesn't leak
    // email existence. The dummy hash is a valid bcrypt of a random string.
    await verifyPassword(password, "$2a$10$abcdefghijklmnopqrstuuwvGtIuiO9rNvIvhCHFYMMoEhQjLAsGVK");
    return null;
  }
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;
  return publicUser(row);
}

/**
 * @param {number} id
 * @returns {User | null}
 */
export function getUserById(id, { db = getDb() } = {}) {
  const row = db.prepare(`SELECT id, email, created_at FROM users WHERE id = ?`).get(id);
  return publicUser(row);
}
