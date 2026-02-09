import { NextResponse } from "next/server";
import { getRedis, getSampleListings } from "@/lib/redis";

export async function POST() {
  try {
    const redis = getRedis();
    await redis.connect().catch(() => {});
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
      { error: "Failed to seed data. Make sure Redis is running." },
      { status: 500 }
    );
  }
}
