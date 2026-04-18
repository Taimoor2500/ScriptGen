import { describe, it, expect } from "vitest";
import { assertPromptContentAllowed } from "../lib/validation/content-policy.js";
import { ValidationError } from "../lib/errors.js";

describe("assertPromptContentAllowed", () => {
  it("allows neutral ideas", () => {
    expect(() =>
      assertPromptContentAllowed("How to make sourdough at home")
    ).not.toThrow();
  });

  it("allows common legitimate phrases that contain risky substrings", () => {
    expect(() =>
      assertPromptContentAllowed(
        "A script about sex education for high school students"
      )
    ).not.toThrow();
  });

  it("rejects profanity", () => {
    expect(() => assertPromptContentAllowed("This is fucking terrible")).toThrow(
      ValidationError
    );
  });

  it("uses content_policy code", () => {
    try {
      assertPromptContentAllowed("shitty content");
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.code).toBe("content_policy");
    }
  });
});
