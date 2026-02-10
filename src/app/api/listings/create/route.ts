import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "landlord") return NextResponse.json({ error: "Endast hyresvärdar kan skapa annonser" }, { status: 403 });

  const VALID_TYPES = ["sale", "rent"] as const;
  const VALID_CATEGORIES = ["butik", "kontor", "lager", "ovrigt"] as const;
  const MAX_TITLE = 200;
  const MAX_DESC = 5000;
  const MAX_CITY = 100;
  const MAX_ADDRESS = 300;
  const MAX_PRICE = 999_999_999;
  const MAX_SIZE = 100_000;

  try {
    const body = await request.json();
    const { title, description, city, address, type, category, price, size, tags, imageUrl } = body;

    if (!title || !description || !city || !address || !type || !category || price == null || price === "" || size == null || size === "") {
      return NextResponse.json({ error: "Alla obligatoriska fält måste fyllas i" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Ogiltig typ. Använd sale eller rent." }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Ogiltig kategori." }, { status: 400 });
    }

    const priceNum = Number(price);
    const sizeNum = Number(size);
    if (Number.isNaN(priceNum) || priceNum < 0 || priceNum > MAX_PRICE) {
      return NextResponse.json({ error: "Ogiltigt pris." }, { status: 400 });
    }
    if (Number.isNaN(sizeNum) || sizeNum < 0 || sizeNum > MAX_SIZE) {
      return NextResponse.json({ error: "Ogiltig storlek (m²)." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    const imageUrlStr = typeof imageUrl === "string" ? imageUrl.trim().slice(0, 2000) : "";

    const listing = await prisma.listing.create({
      data: {
        title: String(title).trim().slice(0, MAX_TITLE),
        description: String(description).trim().slice(0, MAX_DESC),
        city: String(city).trim().slice(0, MAX_CITY),
        address: String(address).trim().slice(0, MAX_ADDRESS),
        type,
        category,
        price: Math.floor(priceNum),
        size: Math.floor(sizeNum),
        imageUrl: imageUrlStr || "",
        tags: Array.isArray(tags) ? tags.slice(0, 20).filter((t: unknown) => typeof t === "string").map((t: string) => t.trim().slice(0, 50)) : [],
        ownerId: session.user.id,
        contactName: user?.name || session.user.name || "",
        contactEmail: user?.email || session.user.email || "",
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
