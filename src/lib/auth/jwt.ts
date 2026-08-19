import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = process.env.JWT_SECRET_KEY || "super-secret-fallback-key";
const key = new TextEncoder().encode(secretKey);

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(payload: any) {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set("syncspace-auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("syncspace-auth")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("syncspace-auth");
}
