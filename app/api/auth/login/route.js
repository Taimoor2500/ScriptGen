import { NextResponse } from "next/server";
import { authRoute, setSessionCookie } from "../../../../lib/auth/http.js";
import { parseLogin } from "../../../../lib/validation/auth.js";
import { authenticate } from "../../../../lib/auth/user.js";
import { createSession } from "../../../../lib/auth/session.js";
import { defaultLimiter, clientKey } from "../../../../lib/rate-limit/in-memory.js";
import { ValidationError, AppError } from "../../../../lib/errors.js";

export const runtime = "nodejs";

export const POST = authRoute("POST /api/auth/login", async (req, { requestId, log }) => {
  defaultLimiter.enforce(`login:${clientKey(req)}`);

  let body;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON body.");
  }
  const { email, password } = parseLogin(body);

  const user = await authenticate(email, password);
  if (!user) {
    // Deliberately vague — no hint whether the email exists.
    throw new AppError("Invalid email or password.", 401, "invalid_credentials");
  }
  const { id: sessionId } = createSession(user.id);

  log.info("login.ok", { user_id: user.id });

  const res = NextResponse.json({ user, requestId }, { headers: { "X-Request-Id": requestId } });
  return setSessionCookie(res, sessionId);
});
