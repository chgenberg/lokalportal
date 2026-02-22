import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

const REGISTER_MAX = 5;
const REGISTER_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const key = `register:${getClientKey(request)}`;
  const { limited, retryAfter } = checkRateLimit(key, REGISTER_MAX, REGISTER_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "För många försök. Försök igen senare." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }
  const MAX_EMAIL = 254;
  const MAX_NAME = 200;
  const MAX_PASSWORD = 128;
  const MAX_PHONE = 50;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    const body = await request.json();
    const { email, password, name, role, phone } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Alla fält måste fyllas i" }, { status: 400 });
    }
    if (!["landlord", "tenant", "agent"].includes(role)) {
      return NextResponse.json({ error: "Ogiltig roll" }, { status: 400 });
    }

    const emailStr = String(email).trim().slice(0, MAX_EMAIL);
    const nameStr = String(name).trim().slice(0, MAX_NAME);
    const passwordStr = String(password).slice(0, MAX_PASSWORD);
    const phoneStr = phone != null ? String(phone).trim().slice(0, MAX_PHONE) : "";

    if (!EMAIL_REGEX.test(emailStr)) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }
    if (nameStr.length === 0) {
      return NextResponse.json({ error: "Namn krävs" }, { status: 400 });
    }
    if (passwordStr.length < 8) {
      return NextResponse.json({ error: "Lösenordet måste vara minst 8 tecken" }, { status: 400 });
    }
    if (!/[A-Z]/.test(passwordStr) || !/[a-z]/.test(passwordStr) || !/[0-9]/.test(passwordStr)) {
      return NextResponse.json({ error: "Lösenordet måste innehålla stora och små bokstäver samt minst en siffra" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: emailStr.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "E-postadressen är redan registrerad" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(passwordStr, 12);

    const user = await prisma.user.create({
      data: {
        email: emailStr.toLowerCase(),
        passwordHash,
        name: nameStr,
        role,
        phone: phoneStr || null,
      },
    });

    return NextResponse.json({ message: "Konto skapat", userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Kunde inte skapa konto" }, { status: 500 });
  }
}
