import { NextResponse } from "next/server";
import { authRoute, clearSessionCookie, parseSessionCookie } from "../../../../lib/auth/http.js";
import { destroySession } from "../../../../lib/auth/session.js";

export const runtime = "nodejs";
// Reads request cookies, so it cannot be prerendered.
export const dynamic = "force-dynamic";

export const POST = authRoute("POST /api/auth/logout", async (req, { requestId, log }) => {
  const cookie = req.headers.get("cookie");
  const sessionId = parseSessionCookie(cookie);
  if (sessionId) {
    destroySession(sessionId);
    log.info("logout.ok");
  }
  const res = NextResponse.json({ ok: true, requestId }, { headers: { "X-Request-Id": requestId } });
  return clearSessionCookie(res);
});
