import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../lib/auth/password.js";

describe("password hashing", () => {
  it("hashes a password to something that doesn't contain it", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
    expect(hash).not.toContain("correct horse battery staple");
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword("Hunter2", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("returns false for empty/invalid hash", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
