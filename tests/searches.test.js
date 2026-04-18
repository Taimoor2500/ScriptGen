import { describe, it, expect, beforeEach } from "vitest";
import { resetTestTables } from "./helpers/db.js";
import { createUser } from "../lib/auth/user.js";
import {
  recordSearch,
  listRecentSearches,
  HISTORY_CAP,
} from "../lib/db/searches.js";

const hasDb = Boolean(process.env.DATABASE_URL);

async function userFixture(email = "u@example.com") {
  return createUser(email, "password123");
}

function baseSearch(userId, overrides = {}) {
  return {
    userId,
    prompt: "Cleopatra",
    tone: "dramatic",
    lengthMinutes: 3,
    model: "claude-haiku-4-5",
    wordCount: 450,
    targetWords: 450,
    script: "**Hook**\n\nShe was twenty...",
    ...overrides,
  };
}

describe.skipIf(!hasDb)("search history", () => {
  beforeEach(async () => {
    await resetTestTables();
  });

  it("inserts and reads back a search", async () => {
    const u = await userFixture();
    const row = await recordSearch(baseSearch(u.id));
    expect(row.id).toBeGreaterThan(0);
    expect(row.prompt).toBe("Cleopatra");

    const recent = await listRecentSearches(u.id);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe(row.id);
  });

  it(`keeps only the ${HISTORY_CAP} most recent entries per user`, async () => {
    const u = await userFixture();
    const base = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) {
      await recordSearch(baseSearch(u.id, { prompt: `idea-${i}` }), { now: () => base + i * 1000 });
    }
    const recent = await listRecentSearches(u.id);
    expect(recent).toHaveLength(HISTORY_CAP);
    expect(recent.map((r) => r.prompt)).toEqual(["idea-4", "idea-3", "idea-2"]);
  });

  it("scopes history per user — one user's inserts don't evict another's", async () => {
    const a = await userFixture("a@example.com");
    const b = await userFixture("b@example.com");
    for (let i = 0; i < 3; i++) await recordSearch(baseSearch(a.id, { prompt: `a-${i}` }));
    for (let i = 0; i < 5; i++) await recordSearch(baseSearch(b.id, { prompt: `b-${i}` }));

    expect(await listRecentSearches(a.id)).toHaveLength(3);
    expect(await listRecentSearches(b.id)).toHaveLength(HISTORY_CAP);
    expect((await listRecentSearches(a.id)).map((r) => r.prompt).sort()).toEqual([
      "a-0",
      "a-1",
      "a-2",
    ]);
  });
});
