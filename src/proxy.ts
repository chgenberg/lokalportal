import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const getSecret = () => {
  const s = process.env.NEXTAUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !s) {
    throw new Error("NEXTAUTH_SECRET is required in production. Set it in your environment.");
  }
  return s || "dev-secret-change-in-production";
};

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: getSecret(),
  });

  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/logga-in", request.url);
      loginUrl.searchParams.set("callback", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Redirect agents to their dedicated dashboard
    if (token.role === "agent") {
      const newPath = pathname.replace(/^\/dashboard/, "/maklare");
      const url = new URL(newPath + request.nextUrl.search, request.url);
      return NextResponse.redirect(url);
    }
  }

  // Protect mäklare routes
  if (pathname.startsWith("/maklare")) {
    if (!token) {
      const loginUrl = new URL("/logga-in", request.url);
      loginUrl.searchParams.set("callback", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== "agent") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === "/logga-in" || pathname === "/registrera") {
    if (token) {
      const dest = token.role === "agent" ? "/maklare" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/maklare/:path*", "/logga-in", "/registrera"],
};
