import { randomBytes } from "node:crypto";
import { getSql } from "../db/client.js";
import { getUserById } from "./user.js";

export const SESSION_COOKIE = "scriptgen_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Opaque 32-byte random token. We store it in the DB; there's no need to
 * HMAC-sign it because compromise of a DB-backed session requires compromising
 * the DB itself, at which point signatures don't help.
 */
function newSessionId() {
  return randomBytes(32).toString("hex");
}

/**
 * Inserts a fresh session row for a user and returns the opaque ID.
 *
 * @param {number} userId
 * @returns {Promise<{ id: string, expiresAt: number }>}
 */
export async function createSession(userId, { sql = getSql(), now = Date.now } = {}) {
  const id = newSessionId();
  const createdAt = now();
  const expiresAt = createdAt + SESSION_TTL_MS;
  await sql`
    INSERT INTO sessions (id, user_id, created_at, expires_at)
    VALUES (${id}, ${userId}, ${createdAt}, ${expiresAt})
  `;
  return { id, expiresAt };
}

/**
 * Look up the current user by session cookie. Quietly returns null for every
 * bad state: missing cookie, unknown ID, expired row, user deleted. Callers
 * should treat null as "logged out" regardless of why.
 *
 * @param {Request | { headers: Headers | { get(name: string): string | null } }} req
 * @returns {Promise<{ user: object, session: { id: string, expires_at: number, user_id: number, created_at: number } } | null>}
 */
export async function readSessionFromRequest(req, { sql = getSql(), now = Date.now } = {}) {
  if (!process.env.DATABASE_URL) return null;
  const cookie = req.headers.get ? req.headers.get("cookie") : null;
  if (!cookie) return null;
  const sessionId = parseSessionCookie(cookie);
  if (!sessionId) return null;

  const rows = await sql`
    SELECT id, user_id, created_at, expires_at FROM sessions WHERE id = ${sessionId}
  `;
  const row = rows[0];
  if (!row) return null;
  if (Number(row.expires_at) < now()) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
    return null;
  }
  const user = await getUserById(Number(row.user_id), { sql });
  if (!user) {
    await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
    return null;
  }
  const session = {
    id: row.id,
    user_id: Number(row.user_id),
    created_at: Number(row.created_at),
    expires_at: Number(row.expires_at),
  };
  return { user, session };
}

/** Delete a session row (logout). */
export async function destroySession(sessionId, { sql = getSql() } = {}) {
  if (!sessionId) return;
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

/**
 * Parses `scriptgen_session=<hex>` out of a raw `Cookie` header. Returns null
 * if the cookie is absent or malformed. Uses a strict hex check so we don't
 * burn a DB round-trip on obviously-invalid tokens.
 *
 * @param {string} cookieHeader
 */
export function parseSessionCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) !== SESSION_COOKIE) continue;
    const val = part.slice(eq + 1);
    if (!/^[a-f0-9]{64}$/i.test(val)) return null;
    return val.toLowerCase();
  }
  return null;
}

/**
 * Serializes a cookie string to set on the response. When `value` is an empty
 * string we emit an immediate-expiry cookie, which is how "logout" clears
 * the session on the client.
 *
 * @param {string} value
 * @param {{ maxAgeSec?: number }} [opts]
 */
export function serializeSessionCookie(value, { maxAgeSec = SESSION_TTL_MS / 1000 } = {}) {
  const secure = process.env.NODE_ENV === "production";
  const attrs = [
    `${SESSION_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) attrs.push("Secure");
  if (!value) {
    attrs.push("Max-Age=0");
    attrs.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  } else {
    attrs.push(`Max-Age=${maxAgeSec}`);
  }
  return attrs.join("; ");
}
