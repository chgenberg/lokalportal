import { NextRequest, NextResponse } from "next/server";
import { getRedis, getSampleListings } from "@/lib/redis";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-seed-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return NextResponse.json(
      { error: "Obehörig" },
      { status: 401 }
    );
  }
  try {
    const redis = getRedis();
    const listings = getSampleListings();

    const pipeline = redis.pipeline();
    listings.forEach((listing) => {
      pipeline.set(`listing:${listing.id}`, JSON.stringify(listing));
    });
    await pipeline.exec();

    return NextResponse.json({
      message: `Seeded ${listings.length} listings`,
      count: listings.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Kunde inte ladda exempeldata. Kontrollera att Redis kör." },
      { status: 500 }
    );
  }
}
