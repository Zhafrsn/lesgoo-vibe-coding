import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export class UserRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserRegistrationError";
  }
}

export class UserLoginError extends Error {
  constructor(message = "Email atau password salah") {
    super(message);
    this.name = "UserLoginError";
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

export async function loginUser(input: LoginUserInput) {
  // Cari user berdasarkan email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw new UserLoginError("Email atau password salah");
  }

  // Verifikasi hash password bcrypt
  const isMatch = await Bun.password.verify(input.password, user.password);
  if (!isMatch) {
    throw new UserLoginError("Email atau password salah");
  }

  // Generate UID token unik
  const token = crypto.randomUUID();

  // Simpan session baru ke database
  await db.insert(sessions).values({
    userId: user.id,
    token: token,
  });

  return { data: token };
}
