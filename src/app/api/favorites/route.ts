import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { listing: true },
  });

  const listings = favorites.map((f) => ({
    ...f.listing,
    createdAt: f.listing.createdAt.toISOString(),
    contact: { name: f.listing.contactName, email: f.listing.contactEmail, phone: f.listing.contactPhone },
  }));

  return NextResponse.json({ listings });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { listingId } = await request.json();
  if (!listingId) return NextResponse.json({ error: "listingId krävs" }, { status: 400 });

  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: session.user.id, listingId } },
    update: {},
    create: { userId: session.user.id, listingId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { listingId } = await request.json();
  if (!listingId) return NextResponse.json({ error: "listingId krävs" }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, listingId },
  });

  return NextResponse.json({ ok: true });
}
