import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

/** GET: Retrieve matches for the current buyer */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const matches = await prisma.match.findMany({
      where: {
        userId: session.user.id,
        dismissed: false,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            city: true,
            address: true,
            propertyType: true,
            price: true,
            size: true,
            rooms: true,
            imageUrl: true,
            imageUrls: true,
            status: true,
            privacyLevel: true,
            createdAt: true,
          },
        },
        buyerProfile: {
          select: { id: true, name: true },
        },
      },
      orderBy: { score: "desc" },
      take: 50,
    });

    return NextResponse.json({
      matches: matches
        .filter((m) => m.listing.status === "active")
        .map((m) => ({
          id: m.id,
          score: m.score,
          seen: m.seen,
          notified: m.notified,
          createdAt: m.createdAt.toISOString(),
          profileName: m.buyerProfile.name,
          profileId: m.buyerProfile.id,
          listing: {
            ...m.listing,
            createdAt: m.listing.createdAt.toISOString(),
          },
        })),
    });
  } catch (err) {
    console.error("Matches GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta matchningar" }, { status: 500 });
  }
}

/** POST: Trigger matching for a specific listing (called when listing is created/updated) */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const { listingId } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId krävs" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "active") {
      return NextResponse.json({ error: "Annons hittades inte eller är inte aktiv" }, { status: 404 });
    }

    const matchCount = await runMatching(listingId);

    return NextResponse.json({
      message: `Matchning genomförd`,
      matchCount,
    });
  } catch (err) {
    console.error("Matching POST error:", err);
    return NextResponse.json({ error: "Matchning misslyckades" }, { status: 500 });
  }
}

/** Core matching engine: matches a listing against all active buyer profiles */
export async function runMatching(listingId: string): Promise<number> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== "active") return 0;

  const profiles = await prisma.buyerProfile.findMany({
    where: {
      active: true,
      userId: { not: listing.ownerId ?? undefined },
    },
  });

  let matchCount = 0;

  for (const profile of profiles) {
    const score = calculateMatchScore(listing, profile);
    if (score < 0.3) continue;

    await prisma.match.upsert({
      where: {
        buyerProfileId_listingId: {
          buyerProfileId: profile.id,
          listingId: listing.id,
        },
      },
      create: {
        buyerProfileId: profile.id,
        listingId: listing.id,
        userId: profile.userId,
        score,
      },
      update: { score },
    });

    matchCount++;
  }

  return matchCount;
}

interface ListingForMatch {
  city: string;
  propertyType: string;
  price: number;
  size: number;
  rooms: number | null;
  lotSize: number | null;
  condition: string | null;
  tags: string[];
}

interface ProfileForMatch {
  areas: string[];
  propertyTypes: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minSize: number | null;
  maxSize: number | null;
  minRooms: number | null;
  maxRooms: number | null;
  minLotSize: number | null;
  maxLotSize: number | null;
  condition: string[];
  features: string[];
}

function calculateMatchScore(listing: ListingForMatch, profile: ProfileForMatch): number {
  let score = 0;
  let factors = 0;

  // Area match
  if (profile.areas.length > 0) {
    factors++;
    const cityLower = listing.city.toLowerCase();
    if (profile.areas.some((a) => cityLower.includes(a.toLowerCase()) || a.toLowerCase().includes(cityLower))) {
      score += 1;
    }
  }

  // Property type match
  if (profile.propertyTypes.length > 0) {
    factors++;
    if (profile.propertyTypes.includes(listing.propertyType)) {
      score += 1;
    }
  }

  // Price range match
  if (profile.minPrice || profile.maxPrice) {
    factors++;
    const inMin = !profile.minPrice || listing.price >= profile.minPrice;
    const inMax = !profile.maxPrice || listing.price <= profile.maxPrice;
    if (inMin && inMax) score += 1;
    else if (inMin || inMax) score += 0.5;
  }

  // Size match
  if (profile.minSize || profile.maxSize) {
    factors++;
    const inMin = !profile.minSize || listing.size >= profile.minSize;
    const inMax = !profile.maxSize || listing.size <= profile.maxSize;
    if (inMin && inMax) score += 1;
    else if (inMin || inMax) score += 0.5;
  }

  // Rooms match
  if ((profile.minRooms || profile.maxRooms) && listing.rooms) {
    factors++;
    const inMin = !profile.minRooms || listing.rooms >= profile.minRooms;
    const inMax = !profile.maxRooms || listing.rooms <= profile.maxRooms;
    if (inMin && inMax) score += 1;
    else if (inMin || inMax) score += 0.5;
  }

  // Lot size match
  if ((profile.minLotSize || profile.maxLotSize) && listing.lotSize) {
    factors++;
    const inMin = !profile.minLotSize || listing.lotSize >= profile.minLotSize;
    const inMax = !profile.maxLotSize || listing.lotSize <= profile.maxLotSize;
    if (inMin && inMax) score += 1;
  }

  // Condition match
  if (profile.condition.length > 0 && listing.condition) {
    factors++;
    if (profile.condition.includes(listing.condition)) score += 1;
  }

  // Features match
  if (profile.features.length > 0 && listing.tags.length > 0) {
    factors++;
    const matched = profile.features.filter((f) =>
      listing.tags.some((t) => t.toLowerCase().includes(f.toLowerCase()))
    ).length;
    score += matched / profile.features.length;
  }

  return factors > 0 ? score / factors : 0;
}
