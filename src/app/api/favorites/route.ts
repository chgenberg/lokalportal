import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  getListingById,
} from "@/lib/redis";
import type { Listing } from "@/lib/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const favoriteIds = await getFavorites(session.user.id);
  const listings: Listing[] = [];
  for (const id of favoriteIds) {
    const listing = await getListingById(id);
    if (listing) listings.push(listing);
  }

  return NextResponse.json({ listings });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { listingId } = await request.json();
  if (!listingId) {
    return NextResponse.json({ error: "listingId krävs" }, { status: 400 });
  }

  await addFavorite(session.user.id, listingId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { listingId } = await request.json();
  if (!listingId) {
    return NextResponse.json({ error: "listingId krävs" }, { status: 400 });
  }

  await removeFavorite(session.user.id, listingId);
  return NextResponse.json({ ok: true });
}
