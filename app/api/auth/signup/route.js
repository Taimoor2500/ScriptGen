import { NextResponse } from "next/server";
import { authRoute, setSessionCookie } from "../../../../lib/auth/http.js";
import { parseSignup } from "../../../../lib/validation/auth.js";
import { createUser } from "../../../../lib/auth/user.js";
import { createSession } from "../../../../lib/auth/session.js";
import { defaultLimiter, clientKey } from "../../../../lib/rate-limit/in-memory.js";
import { ValidationError } from "../../../../lib/errors.js";

export const runtime = "nodejs";

export const POST = authRoute("POST /api/auth/signup", async (req, { requestId, log }) => {
  defaultLimiter.enforce(`signup:${clientKey(req)}`);

  let body;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body.");
  }
  const { email, password } = parseSignup(body);

  const user = await createUser(email, password);
  const { id: sessionId } = await createSession(user.id);

  log.info("signup.ok", { user_id: user.id });

  const res = NextResponse.json({ user, requestId }, { headers: { "X-Request-Id": requestId } });
  return setSessionCookie(res, sessionId);
});
