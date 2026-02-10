import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("NEXTAUTH_SECRET is required in production. Set it in your environment.");
  }
  const token = await getToken({
    req: request,
    secret: secret || "dev-secret-change-in-production",
  });

  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/logga-in", request.url);
      loginUrl.searchParams.set("callback", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === "/logga-in" || pathname === "/registrera") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/logga-in", "/registrera"],
};
