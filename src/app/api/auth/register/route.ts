import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, phone } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Alla fält måste fyllas i" }, { status: 400 });
    }
    if (!["landlord", "tenant"].includes(role)) {
      return NextResponse.json({ error: "Ogiltig roll" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Lösenordet måste vara minst 6 tecken" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "E-postadressen är redan registrerad" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role,
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json({ message: "Konto skapat", userId: user.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kunde inte skapa konto" }, { status: 500 });
  }
}
