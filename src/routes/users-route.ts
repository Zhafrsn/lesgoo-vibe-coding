import { Elysia, t } from "elysia";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  UnauthorizedError,
  UserLoginError,
  UserRegistrationError,
} from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error instanceof UserRegistrationError || error?.message === "email sudah terdaftar") {
          set.status = 400;
          return { error: "email sudah terdaftar" };
        }

        set.status = 500;
        return { error: "Terjadi kesalahan internal server" };
      }
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
      try {
        const result = await loginUser(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        if (error instanceof UserLoginError || error?.message === "Email atau password salah") {
          set.status = 400;
          return { error: "Email atau password salah" };
        }

        set.status = 500;
        return { error: "Terjadi kesalahan internal server" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/current", async ({ headers, set }) => {
    try {
      const authorization = headers["authorization"] || headers["Authorization"];
      if (!authorization || !authorization.startsWith("Bearer ")) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const token = authorization.slice(7).trim();
      if (!token) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const result = await getCurrentUser(token);
      set.status = 200;
      return result;
    } catch (error: any) {
      if (error instanceof UnauthorizedError || error?.message === "Unauthorized") {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      set.status = 500;
      return { error: "Terjadi kesalahan internal server" };
    }
  });
