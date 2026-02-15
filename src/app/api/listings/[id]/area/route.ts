import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { fetchAreaData, fetchAreaPriceContext } from "@/lib/listingGenerate";

const ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Ogiltigt annons-id" }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { city: true, address: true, lat: true, lng: true, category: true, type: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Annonsen hittades inte" }, { status: 404 });
    }

    const lat = listing.lat ?? 0;
    const lng = listing.lng ?? 0;
    const primaryCategory = ((listing.category ?? "").split(",")[0]?.trim()) || (listing.category ?? "");
    const [areaData, priceContext] = await Promise.all([
      fetchAreaData(listing.city, lat, lng, listing.address ?? undefined),
      fetchAreaPriceContext(listing.city, primaryCategory, listing.type),
    ]);

    return NextResponse.json({
      demographics: areaData.demographics,
      nearby: areaData.nearby,
      priceContext,
      walkability: areaData.walkability,
      areaContext: areaData.areaContext,
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte hämta områdesdata" }, { status: 500 });
  }
}
