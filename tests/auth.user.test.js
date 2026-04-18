import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freshTestDb, closeTestDb } from "./helpers/db.js";
import { createUser, authenticate, getUserById } from "../lib/auth/user.js";
import { ValidationError } from "../lib/errors.js";

describe("user accounts", () => {
  beforeEach(() => { freshTestDb(); });
  afterEach(() => { closeTestDb(); });

  it("creates a user and hashes the password on disk", async () => {
    const u = await createUser("Alice@Example.com", "hunter2!!");
    expect(u.id).toBeGreaterThan(0);
    // Email is normalized to lowercase on insert.
    expect(u.email).toBe("alice@example.com");
    expect(u.password_hash).toBeUndefined(); // never leaked
  });

  it("rejects duplicate email with ValidationError", async () => {
    await createUser("dup@example.com", "password123");
    await expect(createUser("DUP@example.com", "password123"))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it("authenticates with correct credentials", async () => {
    await createUser("bob@example.com", "shhh-secret");
    const u = await authenticate("BOB@Example.com", "shhh-secret");
    expect(u).toMatchObject({ email: "bob@example.com" });
  });

  it("returns null on wrong password or missing user", async () => {
    await createUser("carol@example.com", "shhh-secret");
    expect(await authenticate("carol@example.com", "wrong")).toBeNull();
    expect(await authenticate("ghost@example.com", "anything")).toBeNull();
  });

  it("looks up a user by id without password hash", async () => {
    const u = await createUser("dan@example.com", "password123");
    const again = getUserById(u.id);
    expect(again).toMatchObject({ id: u.id, email: "dan@example.com" });
    expect(again.password_hash).toBeUndefined();
  });
});
