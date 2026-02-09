import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const [totalListings, cities, butik, kontor, lager, ovrigt] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.findMany({ select: { city: true }, distinct: ["city"] }),
      prisma.listing.count({ where: { category: "butik" } }),
      prisma.listing.count({ where: { category: "kontor" } }),
      prisma.listing.count({ where: { category: "lager" } }),
      prisma.listing.count({ where: { category: "ovrigt" } }),
    ]);

    return NextResponse.json({
      totalListings,
      totalCities: cities.length,
      byCategory: { butik, kontor, lager, ovrigt },
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte hämta statistik" }, { status: 500 });
  }
}
