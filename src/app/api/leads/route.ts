import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import prisma from "@/lib/db";

const LEADS_MAX = 10;
const LEADS_WINDOW_MS = 15 * 60 * 1000; // 15 min per IP

const MAX_EMAIL = 254;
const MAX_NAME = 200;
const MAX_SOURCE = 100;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const key = `leads:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, LEADS_MAX, LEADS_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "För många försök. Försök igen senare." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }

  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = body.name != null ? String(body.name).trim().slice(0, MAX_NAME) || null : null;
    const source = typeof body.source === "string" ? body.source.trim().slice(0, MAX_SOURCE) : "pdf-generator";

    if (!email) {
      return NextResponse.json({ error: "E-post krävs" }, { status: 400 });
    }
    if (email.length > MAX_EMAIL) {
      return NextResponse.json({ error: "E-postadress är för lång" }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    await prisma.lead.create({
      data: {
        email,
        name: name || undefined,
        source: source || "pdf-generator",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Leads POST error:", err);
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 });
  }
}
