import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

const AUTH_MAX = 10;
const AUTH_WINDOW_MS = 15 * 60 * 1000;

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  return handler(req, context as unknown as never);
}

export async function POST(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const key = `auth:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, AUTH_MAX, AUTH_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "För många inloggningsförsök. Försök igen senare." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }
  return handler(req, context as unknown as never);
}
