import { describe, expect, it, beforeAll } from "bun:test";
import { app } from "../src";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("POST /api/users - Registration API", () => {
  beforeAll(async () => {
    // Clean up test user if exists
    await db.delete(users).where(eq(users.email, "eko@local"));
  });

  it("should successfully register a new user", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "eko",
          email: "eko@local",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: "OK" });

    // Verify stored password is a bcrypt hash and can be verified
    const [savedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "eko@local"))
      .limit(1);

    expect(savedUser).toBeDefined();
    if (!savedUser) throw new Error("User not found in database");

    expect(savedUser.name).toBe("eko");
    expect(savedUser.password).not.toBe("rahasia");
    const isMatch = await Bun.password.verify("rahasia", savedUser.password);
    expect(isMatch).toBe(true);
  });

  it("should return error when registering with already registered email", async () => {
    const res = await app.handle(
      new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "eko",
          email: "eko@local",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "email sudah terdaftar" });
  });
});
