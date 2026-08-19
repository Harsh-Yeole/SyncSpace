"use server";

import { z } from "zod";
import { FormSchema, SignupFormSchema } from "../types";
import db from "../supabase/db";
import { users } from "../../../migrations/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setAuthCookie } from "../auth/jwt";

export async function actionLoginUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  try {
    const userResult = await db.select().from(users).where(eq(users.email, email));
    const user = userResult[0];

    if (!user || !user.password) {
      return { error: { message: "Invalid email or password" } };
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { error: { message: "Invalid email or password" } };
    }

    await setAuthCookie({ id: user.id, email: user.email, fullName: user.fullName });
    
    return { data: { session: true }, error: null };
  } catch (error) {
    return { error: { message: "An unexpected error occurred" } };
  }
}

export async function actionSignupUser(payload: { email?: string, password?: string, fullName?: string }) {
  try {
    console.log("actionSignupUser received payload:", payload);
    const { email, password, fullName } = payload;
    
    if (!email || !password || !fullName) {
      return { error: { message: "Email, password, and full name are required" } };
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser.length > 0) {
      return { error: { message: "User already exists" } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const newUserResult = await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      fullName,
    }).returning();

    const user = newUserResult[0];

    await setAuthCookie({ id: user.id, email: user.email, fullName: user.fullName });

    return { data: { session: true }, error: null };
  } catch (error) {
    return { error: { message: "An unexpected error occurred during signup" } };
  }
}
