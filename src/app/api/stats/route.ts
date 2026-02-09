import { NextResponse } from "next/server";
import { getListingStats } from "@/lib/redis";

export async function GET() {
  try {
    const stats = await getListingStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Kunde inte hämta statistik" },
      { status: 500 }
    );
  }
}
