import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;
const VALID_TYPES = ["sale", "rent"] as const;
const VALID_CATEGORIES = ["butik", "kontor", "lager", "restaurang", "verkstad", "showroom", "popup", "atelje", "gym", "ovrigt"] as const;
const MAX_TITLE = 200;
const MAX_DESC = 5000;
const MAX_CITY = 100;
const MAX_ADDRESS = 300;
const MAX_PRICE = 999_999_999;
const MAX_SIZE = 100_000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Annons-id saknas eller ogiltigt" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: "Annonsen hittades inte" }, { status: 404 });
    }
    const isOwner = session?.user?.id === listing.ownerId;
    if (!isOwner) {
      await prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      listing.viewCount = (listing.viewCount ?? 0) + 1;
    }
    return NextResponse.json({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
      contact: {
        name: listing.contactName,
        email: listing.contactEmail,
        phone: listing.contactPhone,
      },
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte hämta annonsen" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await params;
  if (!id || !ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Annons-id saknas eller ogiltigt" }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: "Annonsen hittades inte" }, { status: 404 });
    if (listing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Du kan bara redigera egna annonser" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, city, address, type, category, price, size, tags, imageUrl } = body;

    if (!title || !description || !city || !address || !type || !category || price == null || price === "" || size == null || size === "") {
      return NextResponse.json({ error: "Alla obligatoriska fält måste fyllas i" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Ogiltig typ." }, { status: 400 });
    }
    // category can be comma-separated (multi-select)
    const categoryParts = String(category).split(",").map((c: string) => c.trim()).filter(Boolean);
    if (categoryParts.length === 0 || !categoryParts.every((c: string) => (VALID_CATEGORIES as readonly string[]).includes(c))) {
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

    const imageUrlStr = typeof imageUrl === "string" ? imageUrl.trim().slice(0, 2000) : "";

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        title: String(title).trim().slice(0, MAX_TITLE),
        description: String(description).trim().slice(0, MAX_DESC),
        city: String(city).trim().slice(0, MAX_CITY),
        address: String(address).trim().slice(0, MAX_ADDRESS),
        type,
        category,
        price: Math.floor(priceNum),
        size: Math.floor(sizeNum),
        imageUrl: imageUrlStr || listing.imageUrl || "",
        tags: Array.isArray(tags) ? tags.slice(0, 20).filter((t: unknown) => typeof t === "string").map((t: string) => t.trim().slice(0, 50)) : listing.tags,
      },
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      contact: { name: updated.contactName, email: updated.contactEmail, phone: updated.contactPhone },
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte uppdatera annonsen" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await params;
  if (!id || !ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Annons-id saknas eller ogiltigt" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body.renew !== true) {
      return NextResponse.json({ error: "Ogiltig åtgärd" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: "Annonsen hittades inte" }, { status: 404 });
    if (listing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Du kan bara förnya egna annonser" }, { status: 403 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { createdAt: new Date() },
    });
    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      contact: { name: updated.contactName, email: updated.contactEmail, phone: updated.contactPhone },
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte förnya annonsen" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await params;
  if (!id || !ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Annons-id saknas eller ogiltigt" }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: "Annonsen hittades inte" }, { status: 404 });
    if (listing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Du kan bara ta bort egna annonser" }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Kunde inte ta bort annonsen" }, { status: 500 });
  }
}
