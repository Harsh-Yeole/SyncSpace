import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("syncspace-auth")?.value;
  const url = request.nextUrl.clone();

  let session = null;
  if (token) {
    session = await verifyToken(token);
  }

  // If user is trying to access dashboard but is not logged in, redirect to login
  if (url.pathname.startsWith("/dashboard")) {
    if (!session) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // If user is trying to access auth pages but is logged in, redirect to dashboard
  const authRoutes = ["/login", "/signup"];
  if (authRoutes.some(route => url.pathname.startsWith(route))) {
    if (session) {
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
