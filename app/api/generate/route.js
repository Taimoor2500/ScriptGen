import { NextResponse } from "next/server";
import { parseGenerateRequest } from "../../../lib/validation/request.js";
import { generateScript } from "../../../lib/anthropic/generate.js";
import { defaultLimiter, clientKey } from "../../../lib/rate-limit/in-memory.js";
import { AppError } from "../../../lib/errors.js";
import { logger } from "../../../lib/logger.js";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  const requestId = randomUUID();
  const log = logger.child({ request_id: requestId, route: "POST /api/generate" });

  try {
    // (1) parse body
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, "Invalid JSON body.", { requestId });
    }

    // (2) rate limit
    const key = clientKey(req);
    const rl = defaultLimiter.enforce(key); // throws RateLimitError on miss

    // (3) validate
    const parsed = parseGenerateRequest(body);
    log.info("request.validated", {
      tone: parsed.tone,
      length: parsed.length,
      prompt_len: parsed.prompt.length,
    });

    // (4) domain
    const result = await generateScript(
      {
        prompt: parsed.prompt,
        tone: parsed.tone,
        length: parsed.length,
      },
      { requestId }
    );

    // (5) success
    return NextResponse.json(
      { ...result, requestId },
      {
        headers: {
          "X-Request-Id": requestId,
          "X-RateLimit-Limit": String(defaultLimiter.config.max),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (err) {
    return handleError(err, { requestId, log });
  }
}

function errorResponse(status, message, { requestId, headers } = {}) {
  return NextResponse.json(
    { error: message, requestId },
    {
      status,
      headers: {
        "X-Request-Id": requestId ?? "",
        ...(headers || {}),
      },
    }
  );
}

function handleError(err, { requestId, log }) {
  if (err instanceof AppError) {
    const headers = {};
    if (err.status === 429 && err.retryAfterSec) {
      headers["Retry-After"] = String(err.retryAfterSec);
      headers["X-RateLimit-Limit"] = String(defaultLimiter.config.max);
      headers["X-RateLimit-Remaining"] = "0";
    }
    log.warn("request.failed", { status: err.status, code: err.code, msg: err.message });
    return errorResponse(err.status, err.message, { requestId, headers });
  }
  // Unexpected — log full detail, return a safe generic message.
  log.error("request.crashed", { msg: err?.message, stack: err?.stack });
  return errorResponse(500, "Unexpected server error.", { requestId });
}
