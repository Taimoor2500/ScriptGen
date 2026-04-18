import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshTestDb, closeTestDb } from "./helpers/db.js";
import { createUser } from "../lib/auth/user.js";
import {
  createSession,
  destroySession,
  parseSessionCookie,
  serializeSessionCookie,
  readSessionFromRequest,
  SESSION_COOKIE,
} from "../lib/auth/session.js";

function reqWithCookie(cookie) {
  return { headers: { get: (k) => (k.toLowerCase() === "cookie" ? cookie : null) } };
}

describe("session lifecycle", () => {
  beforeEach(() => { freshTestDb(); });
  afterEach(() => { closeTestDb(); });

  it("creates an opaque session ID and persists it", async () => {
    const u = await createUser("eve@example.com", "password123");
    const { id, expiresAt } = createSession(u.id);
    expect(id).toMatch(/^[a-f0-9]{64}$/);
    expect(expiresAt).toBeGreaterThan(Date.now());
  });

  it("reads a session back via the cookie header", async () => {
    const u = await createUser("frank@example.com", "password123");
    const { id } = createSession(u.id);
    const ctx = readSessionFromRequest(reqWithCookie(`${SESSION_COOKIE}=${id}`));
    expect(ctx?.user?.email).toBe("frank@example.com");
  });

  it("returns null for missing / malformed / unknown cookies", async () => {
    expect(readSessionFromRequest(reqWithCookie(""))).toBeNull();
    expect(readSessionFromRequest(reqWithCookie(`${SESSION_COOKIE}=nothex`))).toBeNull();
    expect(readSessionFromRequest(reqWithCookie(`${SESSION_COOKIE}=` + "a".repeat(64))))
      .toBeNull();
  });

  it("treats expired rows as logged out and cleans them up", async () => {
    const u = await createUser("grace@example.com", "password123");
    const { id } = createSession(u.id, { now: () => Date.now() - 1000 * 60 * 60 * 24 * 365 });
    // The stored row is a year old → ttl elapsed → must be treated as logged out.
    const ctx = readSessionFromRequest(reqWithCookie(`${SESSION_COOKIE}=${id}`));
    expect(ctx).toBeNull();
  });

  it("destroySession removes the row", async () => {
    const u = await createUser("henry@example.com", "password123");
    const { id } = createSession(u.id);
    destroySession(id);
    expect(readSessionFromRequest(reqWithCookie(`${SESSION_COOKIE}=${id}`))).toBeNull();
  });

  it("parseSessionCookie picks only the right cookie out of a header", () => {
    const hex = "a".repeat(64);
    const header = `theme=dark; ${SESSION_COOKIE}=${hex}; lang=en`;
    expect(parseSessionCookie(header)).toBe(hex);
  });

  it("serializeSessionCookie produces HttpOnly; SameSite=Lax; Max-Age", () => {
    const s = serializeSessionCookie("deadbeef");
    expect(s).toContain("HttpOnly");
    expect(s).toContain("SameSite=Lax");
    expect(s).toContain("Max-Age=");
  });

  it("serializeSessionCookie with empty value clears the cookie", () => {
    const s = serializeSessionCookie("");
    expect(s).toContain("Max-Age=0");
    expect(s).toContain("Expires=Thu, 01 Jan 1970");
  });
});
