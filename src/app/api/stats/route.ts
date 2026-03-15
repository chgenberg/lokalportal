import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const [totalListings, cities, villa, lagenhet, fritidshus, tomt, ovrigt] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.findMany({ select: { city: true }, distinct: ["city"] }),
      prisma.listing.count({ where: { category: "villa" } }),
      prisma.listing.count({ where: { category: "lagenhet" } }),
      prisma.listing.count({ where: { category: "fritidshus" } }),
      prisma.listing.count({ where: { category: "tomt" } }),
      prisma.listing.count({ where: { category: "ovrigt" } }),
    ]);

    return NextResponse.json({
      totalListings,
      totalCities: cities.length,
      byCategory: { villa, lagenhet, fritidshus, tomt, ovrigt },
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Kunde inte hämta statistik" }, { status: 500 });
  }
}
