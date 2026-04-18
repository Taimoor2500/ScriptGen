import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { AppError } from "../errors.js";
import { logger } from "../logger.js";
import {
  SESSION_COOKIE,
  parseSessionCookie,
  readSessionFromRequest,
  serializeSessionCookie,
} from "./session.js";

/**
 * Consistent error response shape for auth routes. Mirrors the shape we use
 * in /api/generate so the client can assume a single error-handling code path.
 */
export function authErrorResponse(status, message, requestId, extraHeaders = {}) {
  return NextResponse.json(
    { error: message, requestId },
    {
      status,
      headers: { "X-Request-Id": requestId, ...extraHeaders },
    }
  );
}

/**
 * Wraps an auth handler with:
 *   - a per-request request_id,
 *   - structured logs,
 *   - AppError → HTTP mapping,
 *   - a 500 fallback for anything unexpected.
 *
 * Keeps every route file small and linear.
 */
export function authRoute(name, handler) {
  return async function wrapped(req) {
    const requestId = randomUUID();
    const log = logger.child({ request_id: requestId, route: name });
    try {
      return await handler(req, { requestId, log });
    } catch (err) {
      if (err instanceof AppError) {
        log.warn("request.failed", { status: err.status, msg: err.message });
        return authErrorResponse(err.status, err.message, requestId);
      }
      log.error("request.crashed", { msg: err?.message, stack: err?.stack });
      return authErrorResponse(500, "Unexpected server error.", requestId);
    }
  };
}

export function setSessionCookie(res, sessionId) {
  res.headers.set("Set-Cookie", serializeSessionCookie(sessionId));
  return res;
}

export function clearSessionCookie(res) {
  res.headers.set("Set-Cookie", serializeSessionCookie(""));
  return res;
}

export { SESSION_COOKIE, parseSessionCookie, readSessionFromRequest };
