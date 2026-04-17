/**
 * Typed application errors. Anything thrown in lib/** should be one of these
 * so the HTTP adapter in app/api/** can map it cleanly to a status + body.
 *
 * Raw `Error` is also caught by the adapter and mapped to 500 — that's the
 * fallthrough for bugs, not expected failure modes.
 */

export class AppError extends Error {
  /**
   * @param {string} message  Safe to show to the end user.
   * @param {number} status   HTTP status code.
   * @param {string} [code]   Stable machine-readable identifier.
   */
  constructor(message, status, code) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message, code = "invalid_request") {
    super(message, 400, code);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends AppError {
  /** @param {number} retryAfterSec */
  constructor(retryAfterSec) {
    super(
      `Rate limit reached. Try again in ${retryAfterSec}s.`,
      429,
      "rate_limited"
    );
    this.name = "RateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

export class ConfigError extends AppError {
  constructor(message, code = "server_misconfigured") {
    super(message, 500, code);
    this.name = "ConfigError";
  }
}

export class UpstreamError extends AppError {
  constructor(message, status = 502, code = "upstream_error") {
    super(message, status, code);
    this.name = "UpstreamError";
  }
}
