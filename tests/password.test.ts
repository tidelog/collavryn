import { describe, expect, it } from "vitest";
import { hash, verify } from "argon2";

describe("Password hashing", () => {
  it("hashes a password without storing it in plaintext", async () => {
    const password = "ExamplePassword123!";

    const passwordHash = await hash(password, {
      type: 2,
    });

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("accepts the correct password", async () => {
    const password = "ExamplePassword123!";
    const passwordHash = await hash(password);

    expect(await verify(passwordHash, password)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const passwordHash = await hash("ExamplePassword123!");

    expect(await verify(passwordHash, "WrongPassword123!")).toBe(false);
  });
});
