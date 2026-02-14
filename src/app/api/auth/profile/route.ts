import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const MAX_NAME = 200;
const MAX_PHONE = 50;
const MAX_COMPANY_NAME = 150;
const MAX_LOGO_URL = 2000;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, role: true, logoUrl: true, companyName: true },
    });
    if (!user) return NextResponse.json({ error: "Användare hittades inte" }, { status: 404 });
    return NextResponse.json({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      logoUrl: user.logoUrl ?? "",
      companyName: user.companyName ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte hämta profil" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, phone, companyName, logoUrl } = body;

    const nameStr = typeof name === "string" ? name.trim().slice(0, MAX_NAME) : undefined;
    const phoneStr = phone != null ? String(phone).trim().slice(0, MAX_PHONE) : undefined;
    const companyNameStr = companyName != null ? String(companyName).trim().slice(0, MAX_COMPANY_NAME) || null : undefined;
    const logoUrlStr = logoUrl != null ? String(logoUrl).trim().slice(0, MAX_LOGO_URL) || null : undefined;

    if (nameStr !== undefined && nameStr.length === 0) {
      return NextResponse.json({ error: "Namn får inte vara tomt" }, { status: 400 });
    }

    const data: { name?: string; phone?: string | null; companyName?: string | null; logoUrl?: string | null } = {};
    if (nameStr !== undefined) data.name = nameStr;
    if (phoneStr !== undefined) data.phone = phoneStr || null;
    if (companyNameStr !== undefined) data.companyName = companyNameStr;
    if (logoUrlStr !== undefined) data.logoUrl = logoUrlStr;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Inga fält att uppdatera" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
    return NextResponse.json({
      name: updated.name,
      email: updated.email,
      phone: updated.phone ?? "",
      logoUrl: updated.logoUrl ?? "",
      companyName: updated.companyName ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte uppdatera profil" }, { status: 500 });
  }
}
