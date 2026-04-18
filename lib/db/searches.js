import { getSql } from "./client.js";

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

function normalizeSearchRow(row) {
  if (!row) return row;
  return {
    ...row,
    id: Number(row.id),
    user_id: Number(row.user_id),
    created_at: Number(row.created_at),
    length_minutes: Number(row.length_minutes),
    word_count: Number(row.word_count),
    target_words: Number(row.target_words),
  };
}

/**
 * Records a search for a user and prunes the user's history down to the
 * HISTORY_CAP most recent entries. Uses a transaction so concurrent generates
 * cannot leave >CAP rows behind.
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
 * @returns {Promise<SavedSearch>}
 */
export async function recordSearch(
  { userId, prompt, tone, lengthMinutes, model, wordCount, targetWords, script },
  { sql = getSql(), now = Date.now } = {}
) {
  const createdAt = now();
  const row = await sql.begin(async (sql) => {
    const inserted = await sql`
      INSERT INTO searches
        (user_id, created_at, prompt, tone, length_minutes, model, word_count, target_words, script)
      VALUES
        (${userId}, ${createdAt}, ${prompt}, ${tone}, ${lengthMinutes}, ${model}, ${wordCount}, ${targetWords}, ${script})
      RETURNING *
    `;
    await sql`
      DELETE FROM searches
      WHERE user_id = ${userId}
        AND id NOT IN (
          SELECT id FROM (
            SELECT id FROM searches WHERE user_id = ${userId}
            ORDER BY created_at DESC, id DESC
            LIMIT ${HISTORY_CAP}
          ) AS keep
        )
    `;
    return inserted[0];
  });
  return normalizeSearchRow(row);
}

/**
 * Returns the HISTORY_CAP most recent searches for a user, newest first.
 * @param {number} userId
 * @returns {Promise<SavedSearch[]>}
 */
export async function listRecentSearches(userId, { sql = getSql() } = {}) {
  const rows = await sql`
    SELECT * FROM searches
    WHERE user_id = ${userId}
    ORDER BY created_at DESC, id DESC
    LIMIT ${HISTORY_CAP}
  `;
  return rows.map(normalizeSearchRow);
}

/**
 * @param {number} id
 * @param {number} userId  Ownership check — return null if the search isn't the user's.
 * @returns {Promise<SavedSearch | null>}
 */
export async function getSearchForUser(id, userId, { sql = getSql() } = {}) {
  const rows = await sql`SELECT * FROM searches WHERE id = ${id} AND user_id = ${userId}`;
  return normalizeSearchRow(rows[0]) ?? null;
}

export { HISTORY_CAP };
