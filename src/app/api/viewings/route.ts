import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const listingId = request.nextUrl.searchParams.get("listingId");

  try {
    const where: Record<string, unknown> = {};

    if (listingId) {
      where.listingId = listingId;
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (listing?.ownerId === session.user.id) {
        // Owner can see all bookings for their listing
      } else {
        where.userId = session.user.id;
      }
    } else {
      where.userId = session.user.id;
    }

    const bookings = await prisma.viewingBooking.findMany({
      where,
      include: {
        listing: { select: { title: true, address: true, city: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        listingId: b.listingId,
        type: b.type,
        status: b.status,
        scheduledAt: b.scheduledAt.toISOString(),
        videoLink: b.videoLink,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        listing: b.listing,
        user: b.user,
      })),
    });
  } catch (err) {
    console.error("Viewings GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta visningar" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const { listingId, type, scheduledAt, notes } = body;

    if (!listingId || !type || !scheduledAt) {
      return NextResponse.json({ error: "listingId, type och scheduledAt krävs" }, { status: 400 });
    }

    if (!["digital", "physical"].includes(type)) {
      return NextResponse.json({ error: "Type måste vara 'digital' eller 'physical'" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "active") {
      return NextResponse.json({ error: "Annons hittades inte" }, { status: 404 });
    }

    if (listing.ownerId === session.user.id) {
      return NextResponse.json({ error: "Du kan inte boka visning av egna objekt" }, { status: 400 });
    }

    const booking = await prisma.viewingBooking.create({
      data: {
        listingId,
        userId: session.user.id,
        type,
        scheduledAt: new Date(scheduledAt),
        notes: typeof notes === "string" ? notes.trim().slice(0, 500) : null,
        videoLink: type === "digital" ? `https://meet.offmarket.nu/${Date.now()}` : null,
      },
    });

    // Notify the seller
    if (listing.ownerId) {
      await prisma.notification.create({
        data: {
          userId: listing.ownerId,
          type: "viewing",
          title: "Ny visningsförfrågan",
          body: `Någon vill boka ${type === "digital" ? "digital" : "fysisk"} visning av "${listing.title}"`,
          link: `/dashboard?tab=listings`,
        },
      });
    }

    return NextResponse.json({
      id: booking.id,
      type: booking.type,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
      videoLink: booking.videoLink,
    }, { status: 201 });
  } catch (err) {
    console.error("Viewings POST error:", err);
    return NextResponse.json({ error: "Kunde inte skapa visningsbokning" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const { bookingId, status } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ error: "bookingId och status krävs" }, { status: 400 });
    }

    if (!["confirmed", "completed", "canceled"].includes(status)) {
      return NextResponse.json({ error: "Ogiltig status" }, { status: 400 });
    }

    const booking = await prisma.viewingBooking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { ownerId: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: "Bokning hittades inte" }, { status: 404 });
    }

    const isOwner = booking.listing.ownerId === session.user.id;
    const isBooker = booking.userId === session.user.id;

    if (!isOwner && !isBooker) {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    const updated = await prisma.viewingBooking.update({
      where: { id: bookingId },
      data: { status },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
    });
  } catch (err) {
    console.error("Viewings PATCH error:", err);
    return NextResponse.json({ error: "Kunde inte uppdatera visning" }, { status: 500 });
  }
}
