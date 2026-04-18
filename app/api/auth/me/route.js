import { NextResponse } from "next/server";
import { authRoute, readSessionFromRequest } from "../../../../lib/auth/http.js";

export const runtime = "nodejs";
// Reads request cookies, so it cannot be prerendered.
export const dynamic = "force-dynamic";

export const GET = authRoute("GET /api/auth/me", async (req, { requestId }) => {
  const ctx = readSessionFromRequest(req);
  return NextResponse.json(
    { user: ctx?.user || null, requestId },
    { headers: { "X-Request-Id": requestId } }
  );
});
