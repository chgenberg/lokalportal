import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "landlord") return NextResponse.json({ error: "Endast hyresvärdar kan skapa annonser" }, { status: 403 });

  try {
    const body = await request.json();
    const { title, description, city, address, type, category, price, size, tags } = body;

    if (!title || !description || !city || !address || !type || !category || !price || !size) {
      return NextResponse.json({ error: "Alla obligatoriska fält måste fyllas i" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        address: address.trim(),
        type,
        category,
        price: Number(price),
        size: Number(size),
        tags: Array.isArray(tags) ? tags : [],
        ownerId: session.user.id,
        contactName: user?.name || session.user.name,
        contactEmail: user?.email || session.user.email,
        contactPhone: user?.phone || "",
      },
    });

    return NextResponse.json({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
      contact: { name: listing.contactName, email: listing.contactEmail, phone: listing.contactPhone },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kunde inte skapa annons" }, { status: 500 });
  }
}
