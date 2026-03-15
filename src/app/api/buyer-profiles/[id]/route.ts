import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await params;

  try {
    const profile = await prisma.buyerProfile.findUnique({ where: { id } });
    if (!profile || profile.userId !== session.user.id) {
      return NextResponse.json({ error: "Sökprofil hittades inte" }, { status: 404 });
    }

    return NextResponse.json({
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("BuyerProfile GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta sökprofil" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.buyerProfile.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Sökprofil hittades inte" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.name === "string") updateData.name = body.name.trim().slice(0, 100) || "Min sökning";
    if (typeof body.active === "boolean") updateData.active = body.active;
    if (Array.isArray(body.areas)) updateData.areas = body.areas.filter((a: unknown) => typeof a === "string").slice(0, 20);
    if (Array.isArray(body.propertyTypes)) updateData.propertyTypes = body.propertyTypes.filter((t: unknown) => typeof t === "string").slice(0, 10);
    if (body.minPrice !== undefined) updateData.minPrice = typeof body.minPrice === "number" && body.minPrice > 0 ? body.minPrice : null;
    if (body.maxPrice !== undefined) updateData.maxPrice = typeof body.maxPrice === "number" && body.maxPrice > 0 ? body.maxPrice : null;
    if (body.minSize !== undefined) updateData.minSize = typeof body.minSize === "number" && body.minSize > 0 ? body.minSize : null;
    if (body.maxSize !== undefined) updateData.maxSize = typeof body.maxSize === "number" && body.maxSize > 0 ? body.maxSize : null;
    if (body.minRooms !== undefined) updateData.minRooms = typeof body.minRooms === "number" && body.minRooms > 0 ? body.minRooms : null;
    if (body.maxRooms !== undefined) updateData.maxRooms = typeof body.maxRooms === "number" && body.maxRooms > 0 ? body.maxRooms : null;
    if (body.minLotSize !== undefined) updateData.minLotSize = typeof body.minLotSize === "number" && body.minLotSize > 0 ? body.minLotSize : null;
    if (body.maxLotSize !== undefined) updateData.maxLotSize = typeof body.maxLotSize === "number" && body.maxLotSize > 0 ? body.maxLotSize : null;
    if (Array.isArray(body.condition)) updateData.condition = body.condition.filter((c: unknown) => typeof c === "string").slice(0, 10);
    if (Array.isArray(body.features)) updateData.features = body.features.filter((f: unknown) => typeof f === "string").slice(0, 20);
    if (typeof body.notifyEmail === "boolean") updateData.notifyEmail = body.notifyEmail;
    if (typeof body.notifyPush === "boolean") updateData.notifyPush = body.notifyPush;

    const profile = await prisma.buyerProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("BuyerProfile PUT error:", err);
    return NextResponse.json({ error: "Kunde inte uppdatera sökprofil" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.buyerProfile.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Sökprofil hittades inte" }, { status: 404 });
    }

    await prisma.buyerProfile.delete({ where: { id } });
    return NextResponse.json({ message: "Sökprofil borttagen" });
  } catch (err) {
    console.error("BuyerProfile DELETE error:", err);
    return NextResponse.json({ error: "Kunde inte ta bort sökprofil" }, { status: 500 });
  }
}
