import { Elysia, t } from "elysia";
import { registerUser, UserRegistrationError } from "../services/users-service";

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
  );
