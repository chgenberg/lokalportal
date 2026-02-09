import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveListing, getUserById } from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";
import type { Listing } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  if (session.user.role !== "landlord") {
    return NextResponse.json(
      { error: "Endast hyresvärdar kan skapa annonser" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, city, address, type, category, price, size, tags } = body;

    if (!title || !description || !city || !address || !type || !category || !price || !size) {
      return NextResponse.json(
        { error: "Alla obligatoriska fält måste fyllas i" },
        { status: 400 }
      );
    }

    const user = await getUserById(session.user.id);

    const listing: Listing = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      address: address.trim(),
      type,
      category,
      price: Number(price),
      size: Number(size),
      imageUrl: "",
      featured: false,
      createdAt: new Date().toISOString(),
      lat: 0,
      lng: 0,
      tags: Array.isArray(tags) ? tags : [],
      ownerId: session.user.id,
      contact: {
        name: user?.name || session.user.name,
        email: user?.email || session.user.email,
        phone: user?.phone || "",
      },
    };

    await saveListing(listing);

    return NextResponse.json(listing, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Kunde inte skapa annons" },
      { status: 500 }
    );
  }
}
