import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const profiles = await prisma.buyerProfile.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      profiles: profiles.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("BuyerProfiles GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta sökprofiler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      name,
      areas,
      propertyTypes,
      minPrice,
      maxPrice,
      minSize,
      maxSize,
      minRooms,
      maxRooms,
      minLotSize,
      maxLotSize,
      condition,
      features,
      notifyEmail,
      notifyPush,
    } = body;

    const existing = await prisma.buyerProfile.count({ where: { userId: session.user.id } });
    if (existing >= 10) {
      return NextResponse.json({ error: "Max 10 sökprofiler tillåtna" }, { status: 400 });
    }

    const profile = await prisma.buyerProfile.create({
      data: {
        userId: session.user.id,
        name: typeof name === "string" ? name.trim().slice(0, 100) || "Min sökning" : "Min sökning",
        areas: Array.isArray(areas) ? areas.filter((a: unknown) => typeof a === "string").slice(0, 20) : [],
        propertyTypes: Array.isArray(propertyTypes) ? propertyTypes.filter((t: unknown) => typeof t === "string").slice(0, 10) : [],
        minPrice: typeof minPrice === "number" && minPrice > 0 ? minPrice : null,
        maxPrice: typeof maxPrice === "number" && maxPrice > 0 ? maxPrice : null,
        minSize: typeof minSize === "number" && minSize > 0 ? minSize : null,
        maxSize: typeof maxSize === "number" && maxSize > 0 ? maxSize : null,
        minRooms: typeof minRooms === "number" && minRooms > 0 ? minRooms : null,
        maxRooms: typeof maxRooms === "number" && maxRooms > 0 ? maxRooms : null,
        minLotSize: typeof minLotSize === "number" && minLotSize > 0 ? minLotSize : null,
        maxLotSize: typeof maxLotSize === "number" && maxLotSize > 0 ? maxLotSize : null,
        condition: Array.isArray(condition) ? condition.filter((c: unknown) => typeof c === "string").slice(0, 10) : [],
        features: Array.isArray(features) ? features.filter((f: unknown) => typeof f === "string").slice(0, 20) : [],
        notifyEmail: typeof notifyEmail === "boolean" ? notifyEmail : true,
        notifyPush: typeof notifyPush === "boolean" ? notifyPush : false,
      },
    });

    // Also mark user as a buyer
    if (!session.user.isBuyer) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isBuyer: true },
      });
    }

    return NextResponse.json({
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("BuyerProfiles POST error:", err);
    return NextResponse.json({ error: "Kunde inte skapa sökprofil" }, { status: 500 });
  }
}
