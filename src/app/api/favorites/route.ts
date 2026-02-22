import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import prisma from "@/lib/db";

const LISTING_ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const checkListingId = searchParams.get("check");
    if (checkListingId && LISTING_ID_REGEX.test(checkListingId)) {
      const fav = await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId: checkListingId } },
      });
      return NextResponse.json({ favorited: !!fav });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { listing: true },
    });

    const listings = favorites.map((f) => ({
      ...f.listing,
      createdAt: f.listing.createdAt.toISOString(),
      savedAt: f.createdAt.toISOString(),
      contact: { name: f.listing.contactName, email: f.listing.contactEmail, phone: f.listing.contactPhone },
    }));

    return NextResponse.json({ listings });
  } catch (err) {
    console.error("Favorites GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta favoriter" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

    const { limited, retryAfter } = checkRateLimit(`fav-add:${session.user.id}`, 30, 15 * 60 * 1000);
    if (limited) {
      return NextResponse.json(
        { error: "För många förfrågningar. Försök igen senare." },
        { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
      );
    }

    const { listingId } = await request.json();
    if (!listingId || typeof listingId !== "string" || !LISTING_ID_REGEX.test(listingId)) {
      return NextResponse.json({ error: "listingId krävs och måste vara giltigt" }, { status: 400 });
    }

    await prisma.favorite.upsert({
      where: { userId_listingId: { userId: session.user.id, listingId } },
      update: {},
      create: { userId: session.user.id, listingId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Favorites POST error:", err);
    return NextResponse.json({ error: "Kunde inte lägga till favorit" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

    const { listingId } = await request.json();
    if (!listingId || typeof listingId !== "string" || !LISTING_ID_REGEX.test(listingId)) {
      return NextResponse.json({ error: "listingId krävs och måste vara giltigt" }, { status: 400 });
    }

    await prisma.favorite.deleteMany({
      where: { userId: session.user.id, listingId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Favorites DELETE error:", err);
    return NextResponse.json({ error: "Kunde inte ta bort favorit" }, { status: 500 });
  }
}
