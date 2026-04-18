import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshTestDb, closeTestDb } from "./helpers/db.js";
import { createUser } from "../lib/auth/user.js";
import {
  recordSearch,
  listRecentSearches,
  HISTORY_CAP,
} from "../lib/db/searches.js";

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

describe("search history", () => {
  beforeEach(() => { freshTestDb(); });
  afterEach(() => { closeTestDb(); });

  it("inserts and reads back a search", async () => {
    const u = await userFixture();
    const row = recordSearch(baseSearch(u.id));
    expect(row.id).toBeGreaterThan(0);
    expect(row.prompt).toBe("Cleopatra");

    const recent = listRecentSearches(u.id);
    expect(recent).toHaveLength(1);
    expect(recent[0].id).toBe(row.id);
  });

  it(`keeps only the ${HISTORY_CAP} most recent entries per user`, async () => {
    const u = await userFixture();
    // Insert 5 with monotonically increasing timestamps so ordering is deterministic.
    const base = 1_700_000_000_000;
    for (let i = 0; i < 5; i++) {
      recordSearch(baseSearch(u.id, { prompt: `idea-${i}` }), { now: () => base + i * 1000 });
    }
    const recent = listRecentSearches(u.id);
    expect(recent).toHaveLength(HISTORY_CAP);
    // Newest-first — the three we kept should be idea-4, idea-3, idea-2.
    expect(recent.map((r) => r.prompt)).toEqual(["idea-4", "idea-3", "idea-2"]);
  });

  it("scopes history per user — one user's inserts don't evict another's", async () => {
    const a = await userFixture("a@example.com");
    const b = await userFixture("b@example.com");
    for (let i = 0; i < 3; i++) recordSearch(baseSearch(a.id, { prompt: `a-${i}` }));
    for (let i = 0; i < 5; i++) recordSearch(baseSearch(b.id, { prompt: `b-${i}` }));

    expect(listRecentSearches(a.id)).toHaveLength(3);
    expect(listRecentSearches(b.id)).toHaveLength(HISTORY_CAP);
    // A's rows are intact.
    expect(listRecentSearches(a.id).map((r) => r.prompt).sort()).toEqual(["a-0", "a-1", "a-2"]);
  });
});
