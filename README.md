# Lesgoo Vibe Coding

Backend project built with **Bun**, **ElysiaJS**, **Drizzle ORM**, and **MySQL**.

## Tech Stack
- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** MySQL (via `mysql2`)

---

## Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and adjust your MySQL connection details:
```bash
cp .env.example .env
```

### 3. Database Migrations (Drizzle Kit)
- **Generate migrations:**
  ```bash
  bun run db:generate
  ```
- **Apply migrations:**
  ```bash
  bun run db:migrate
  ```
- **Push schema directly (for development):**
  ```bash
  bun run db:push
  ```
- **Launch Drizzle Studio:**
  ```bash
  bun run db:studio
  ```

### 4. Running the Server
- **Development (with hot reload):**
  ```bash
  bun run dev
  ```
- **Production:**
  ```bash
  bun run start
  ```

---

## Endpoints
- `GET /` - Welcome message & status
- `GET /health` - Health check & uptime
