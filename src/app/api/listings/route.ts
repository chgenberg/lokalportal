import { NextRequest, NextResponse } from "next/server";
import { getFilteredListings } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters = {
    city: searchParams.get("city") || undefined,
    type: searchParams.get("type") || undefined,
    category: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    featured: searchParams.get("featured") === "true" ? true : undefined,
  };

  try {
    const listings = await getFilteredListings(filters);
    return NextResponse.json(listings);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}
