import { getDb, withTransaction } from "./client.js";

const HISTORY_CAP = 3;

/**
 * @typedef {Object} SavedSearch
 * @property {number} id
 * @property {number} user_id
 * @property {number} created_at    epoch ms
 * @property {string} prompt
 * @property {string} tone
 * @property {number} length_minutes
 * @property {string} model
 * @property {number} word_count
 * @property {number} target_words
 * @property {string} script
 */

/**
 * Records a search for a user and prunes the user's history down to the
 * HISTORY_CAP most recent entries. Wrapped in an IMMEDIATE transaction so
 * a race between two concurrent generate calls can't leave >CAP rows behind.
 *
 * @param {Object} p
 * @param {number} p.userId
 * @param {string} p.prompt
 * @param {string} p.tone
 * @param {number} p.lengthMinutes
 * @param {string} p.model
 * @param {number} p.wordCount
 * @param {number} p.targetWords
 * @param {string} p.script
 * @param {object} [deps]  Injectable for testing.
 * @returns {SavedSearch}
 */
export function recordSearch(
  { userId, prompt, tone, lengthMinutes, model, wordCount, targetWords, script },
  { db = getDb(), now = Date.now } = {}
) {
  const id = withTransaction(db, () => {
    const createdAt = now();
    const info = db
      .prepare(
        `INSERT INTO searches
           (user_id, created_at, prompt, tone, length_minutes, model, word_count, target_words, script)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(userId, createdAt, prompt, tone, lengthMinutes, model, wordCount, targetWords, script);

    // Trim back to the N most recent. The subselect picks the IDs we want
    // to keep; anything else for this user gets deleted.
    db.prepare(
      `DELETE FROM searches
       WHERE user_id = ?
         AND id NOT IN (
           SELECT id FROM searches
           WHERE user_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT ?
         )`
    ).run(userId, userId, HISTORY_CAP);

    // node:sqlite may return BigInt for large IDs; normalize to Number so
    // downstream callers and JSON serialization don't have to care.
    return Number(info.lastInsertRowid);
  });

  return db.prepare(`SELECT * FROM searches WHERE id = ?`).get(id);
}

/**
 * Returns the HISTORY_CAP most recent searches for a user, newest first.
 * @param {number} userId
 * @returns {SavedSearch[]}
 */
export function listRecentSearches(userId, { db = getDb() } = {}) {
  return db
    .prepare(
      `SELECT * FROM searches
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT ?`
    )
    .all(userId, HISTORY_CAP);
}

/**
 * @param {number} id
 * @param {number} userId  Ownership check — return null if the search isn't the user's.
 * @returns {SavedSearch | null}
 */
export function getSearchForUser(id, userId, { db = getDb() } = {}) {
  const row = db
    .prepare(`SELECT * FROM searches WHERE id = ? AND user_id = ?`)
    .get(id, userId);
  return row || null;
}

export { HISTORY_CAP };
