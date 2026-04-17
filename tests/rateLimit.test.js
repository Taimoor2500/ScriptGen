import { describe, it, expect } from "vitest";
import { createInMemoryRateLimiter } from "../lib/rate-limit/in-memory.js";
import { RateLimitError } from "../lib/errors.js";

describe("createInMemoryRateLimiter", () => {
  it("allows up to `max` requests then blocks", () => {
    const rl = createInMemoryRateLimiter({ max: 3, windowMs: 60_000 });
    expect(rl.check("ip1").ok).toBe(true);
    expect(rl.check("ip1").ok).toBe(true);
    expect(rl.check("ip1").ok).toBe(true);
    const blocked = rl.check("ip1");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("keeps buckets isolated by key", () => {
    const rl = createInMemoryRateLimiter({ max: 1, windowMs: 60_000 });
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(false);
    expect(rl.check("b").ok).toBe(true);
  });

  it("enforce() throws RateLimitError when exceeded", () => {
    const rl = createInMemoryRateLimiter({ max: 1, windowMs: 60_000 });
    rl.enforce("x");
    expect(() => rl.enforce("x")).toThrow(RateLimitError);
  });

  it("returns remaining count accurately", () => {
    const rl = createInMemoryRateLimiter({ max: 5, windowMs: 60_000 });
    expect(rl.check("x").remaining).toBe(4);
    expect(rl.check("x").remaining).toBe(3);
  });
});
