import { describe, expect, it, beforeAll } from "bun:test";
import { app } from "../src";
import { db } from "../src/db";
import { sessions, users } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("User API Tests", () => {
  let sessionToken = "";

  beforeAll(async () => {
    // Bersihkan sesi dan user pengujian jika ada
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "eko@local"))
      .limit(1);

    if (existing) {
      await db.delete(sessions).where(eq(sessions.userId, existing.id));
      await db.delete(users).where(eq(users.id, existing.id));
    }
  });

  describe("POST /api/users - Registration API", () => {
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
      const body = (await res.json()) as { data?: string; error?: string };
      expect(body).toEqual({ data: "OK" });

      // Verifikasi password tersimpan dalam format hash bcrypt
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
      const body = (await res.json()) as { data?: string; error?: string };
      expect(body).toEqual({ error: "email sudah terdaftar" });
    });
  });

  describe("POST /api/users/login - Login API", () => {
    it("should successfully login with valid credentials and return session token", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@local",
            password: "rahasia",
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { data?: string; error?: string };
      expect(body.data).toBeDefined();
      expect(typeof body.data).toBe("string");
      expect(body.data?.length).toBeGreaterThan(0);

      sessionToken = body.data!;

      // Verifikasi token tersimpan di tabel sessions
      const [savedSession] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, body.data!))
        .limit(1);

      expect(savedSession).toBeDefined();
      if (!savedSession) throw new Error("Session not saved in database");
      expect(savedSession.token).toBe(body.data!);
    });

    it("should return 400 when login with wrong password", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "eko@local",
            password: "passwordsalah",
          }),
        })
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { data?: string; error?: string };
      expect(body).toEqual({ error: "Email atau password salah" });
    });

    it("should return 400 when login with unregistered email", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "tidakada@local",
            password: "rahasia",
          }),
        })
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { data?: string; error?: string };
      expect(body).toEqual({ error: "Email atau password salah" });
    });
  });

  describe("GET /api/users/current - Current User API", () => {
    it("should return current user profile when given valid Bearer token", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        })
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        data?: { id: number; name: string; email: string; created_at: string; password?: string };
        error?: string;
      };

      expect(body.data).toBeDefined();
      expect(body.data?.name).toBe("eko");
      expect(body.data?.email).toBe("eko@local");
      expect(body.data?.created_at).toBeDefined();
      expect(body.data?.password).toBeUndefined();
    });

    it("should return 401 when Authorization header is missing", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
        })
      );

      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: string };
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 when Authorization header does not use Bearer scheme", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Basic 123456",
          },
        })
      );

      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: string };
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 when Bearer token is empty", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer   ",
          },
        })
      );

      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: string };
      expect(body).toEqual({ error: "Unauthorized" });
    });

    it("should return 401 when Bearer token is invalid or non-existent", async () => {
      const res = await app.handle(
        new Request("http://localhost:3000/api/users/current", {
          method: "GET",
          headers: {
            Authorization: "Bearer token-palsu-12345",
          },
        })
      );

      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: string };
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });
});
