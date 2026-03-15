import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Ej inloggad", status: 401 };
  if (!session.user.isAdmin) return { error: "Ej behörig", status: 403 };
  return { session };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "50"), 100);
  const status = request.nextUrl.searchParams.get("status") ?? "";
  const search = request.nextUrl.searchParams.get("search") ?? "";

  try {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          propertyType: true,
          price: true,
          size: true,
          status: true,
          featured: true,
          viewCount: true,
          ownershipVerified: true,
          createdAt: true,
          owner: { select: { name: true, email: true, bankIdVerified: true } },
          _count: { select: { conversations: true, favorites: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings: listings.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        conversationCount: l._count.conversations,
        favoriteCount: l._count.favorites,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin listings GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta annonser" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { listingId, action, status: newStatus } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId krävs" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: "Annons hittades inte" }, { status: 404 });

    if (action === "setStatus" && newStatus) {
      if (!["draft", "active", "paused", "sold", "removed"].includes(newStatus)) {
        return NextResponse.json({ error: "Ogiltig status" }, { status: 400 });
      }
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: newStatus },
      });
      return NextResponse.json({ message: `Status ändrad till ${newStatus}` });
    }

    if (action === "toggleFeatured") {
      await prisma.listing.update({
        where: { id: listingId },
        data: { featured: !listing.featured },
      });
      return NextResponse.json({ message: listing.featured ? "Borttagen som utvald" : "Markerad som utvald" });
    }

    if (action === "verifyOwnership") {
      await prisma.listing.update({
        where: { id: listingId },
        data: { ownershipVerified: true },
      });
      return NextResponse.json({ message: "Ägarskap verifierat" });
    }

    return NextResponse.json({ error: "Ogiltig åtgärd" }, { status: 400 });
  } catch (err) {
    console.error("Admin listings PATCH error:", err);
    return NextResponse.json({ error: "Kunde inte uppdatera annons" }, { status: 500 });
  }
}
