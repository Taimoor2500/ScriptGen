import { NextResponse } from "next/server";
import { authRoute, readSessionFromRequest } from "../../../lib/auth/http.js";
import { listRecentSearches } from "../../../lib/db/searches.js";

export const runtime = "nodejs";
// Reads request cookies, so it cannot be prerendered.
export const dynamic = "force-dynamic";

/**
 * Returns the current user's N most recent searches (N = 3).
 * If the caller isn't logged in we return 200 with an empty array rather
 * than 401 — history is a nice-to-have, not an auth barrier.
 */
export const GET = authRoute("GET /api/history", async (req, { requestId }) => {
  const ctx = readSessionFromRequest(req);
  if (!ctx) {
    return NextResponse.json(
      { searches: [], requestId },
      { headers: { "X-Request-Id": requestId } }
    );
  }
  const rows = listRecentSearches(ctx.user.id);
  const searches = rows.map(toPublic);
  return NextResponse.json(
    { searches, requestId },
    { headers: { "X-Request-Id": requestId } }
  );
});

function toPublic(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    prompt: row.prompt,
    tone: row.tone,
    length: row.length_minutes,
    model: row.model,
    wordCount: row.word_count,
    targetWords: row.target_words,
    script: row.script,
  };
}
