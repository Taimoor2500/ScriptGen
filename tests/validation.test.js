import { describe, it, expect } from "vitest";
import { parseGenerateRequest } from "../lib/validation/request.js";
import { ValidationError } from "../lib/errors.js";

describe("parseGenerateRequest", () => {
  const ok = {
    prompt: "The life and death of Cleopatra",
    tone: "dramatic",
    length: 3,
  };

  it("accepts a valid body", () => {
    const r = parseGenerateRequest(ok);
    expect(r.tone).toBe("dramatic");
    expect(r.length).toBe(3);
  });

  it("rejects empty prompt", () => {
    expect(() => parseGenerateRequest({ ...ok, prompt: "  " })).toThrow(
      ValidationError
    );
  });

  it("rejects prompt > 2000 chars", () => {
    const long = "a".repeat(2001);
    expect(() => parseGenerateRequest({ ...ok, prompt: long })).toThrow(
      ValidationError
    );
  });

  it("rejects invalid tone", () => {
    expect(() => parseGenerateRequest({ ...ok, tone: "serious" })).toThrow(
      ValidationError
    );
  });

  it("rejects invalid length", () => {
    expect(() => parseGenerateRequest({ ...ok, length: 7 })).toThrow(
      ValidationError
    );
  });

  it("accepts string length and coerces", () => {
    const r = parseGenerateRequest({ ...ok, length: "5" });
    expect(r.length).toBe(5);
  });
});
