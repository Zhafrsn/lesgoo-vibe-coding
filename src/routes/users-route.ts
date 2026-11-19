import { Elysia, t } from "elysia";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  UnauthorizedError,
  UserLoginError,
  UserRegistrationError,
} from "../services/users-service";

export function extractBearerToken(headers: Record<string, string | undefined>): string {
  const authorization = headers["authorization"] || headers["Authorization"];
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new UnauthorizedError("Unauthorized");
  }

  const token = authorization.slice(7).trim();
  if (!token) {
    throw new UnauthorizedError("Unauthorized");
  }

  return token;
}

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .onError(({ error, set }) => {
    const message = "message" in error ? error.message : "";

    if (error instanceof UnauthorizedError || message === "Unauthorized") {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    if (error instanceof UserRegistrationError || message === "email sudah terdaftar") {
      set.status = 400;
      return { error: "email sudah terdaftar" };
    }

    if (error instanceof UserLoginError || message === "Email atau password salah") {
      set.status = 400;
      return { error: "Email atau password salah" };
    }

    set.status = 500;
    return { error: "Terjadi kesalahan internal server" };
  })
  .post(
    "/",
    async ({ body, set }) => {
      const result = await registerUser(body);
      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const result = await loginUser(body);
      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/current", async ({ headers, set }) => {
    const token = extractBearerToken(headers);
    const result = await getCurrentUser(token);
    set.status = 200;
    return result;
  })
  .delete("/logout", async ({ headers, set }) => {
    const token = extractBearerToken(headers);
    const result = await logoutUser(token);
    set.status = 200;
    return result;
  });
