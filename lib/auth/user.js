import { getSql } from "../db/client.js";
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
  return {
    id: Number(row.id),
    email: row.email,
    created_at: Number(row.created_at),
  };
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
export async function createUser(email, password, { sql = getSql(), now = Date.now } = {}) {
  const normalized = email.trim().toLowerCase();
  const hash = await hashPassword(password);
  const createdAt = now();

  try {
    const rows = await sql`
      INSERT INTO users (email, password_hash, created_at)
      VALUES (${normalized}, ${hash}, ${createdAt})
      RETURNING id, email, created_at
    `;
    return publicUser(rows[0]);
  } catch (err) {
    if (err?.code === "23505") {
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
export async function authenticate(email, password, { sql = getSql() } = {}) {
  const normalized = email.trim().toLowerCase();
  const rows = await sql`
    SELECT id, email, password_hash, created_at FROM users WHERE lower(email) = ${normalized}
  `;
  const row = rows[0];
  if (!row) {
    await verifyPassword(password, "$2a$10$abcdefghijklmnopqrstuuwvGtIuiO9rNvIvhCHFYMMoEhQjLAsGVK");
    return null;
  }
  const ok = await verifyPassword(password, row.password_hash);
  if (!ok) return null;
  return publicUser(row);
}

/**
 * @param {number} id
 * @returns {Promise<User | null>}
 */
export async function getUserById(id, { sql = getSql() } = {}) {
  const rows = await sql`SELECT id, email, created_at FROM users WHERE id = ${id}`;
  return publicUser(rows[0]);
}
