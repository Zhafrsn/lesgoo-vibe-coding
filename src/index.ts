import { Elysia } from "elysia";
import { usersRoute } from "./routes/users-route";

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .get("/", () => ({
    message: "Welcome to Elysia + Bun + Drizzle + MySQL API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }))
  .use(usersRoute)
  .listen(port);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
