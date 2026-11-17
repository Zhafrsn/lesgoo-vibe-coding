import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export class UserRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserRegistrationError";
  }
}

export async function registerUser(input: RegisterUserInput) {
  // Cek apakah email sudah terdaftar
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new UserRegistrationError("email sudah terdaftar");
  }

  // Hash password menggunakan bcrypt via Bun native API
  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // Simpan user baru ke database
  try {
    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) {
      throw new UserRegistrationError("email sudah terdaftar");
    }
    throw err;
  }

  return { data: "OK" as const };
}
