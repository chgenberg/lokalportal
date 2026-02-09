import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

const ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !ID_REGEX.test(id)) {
    return NextResponse.json({ error: "Annons-id saknas eller ogiltigt" }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: "Annonsen hittades inte" }, { status: 404 });
    }
    return NextResponse.json({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
      contact: {
        name: listing.contactName,
        email: listing.contactEmail,
        phone: listing.contactPhone,
      },
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte hämta annonsen" }, { status: 500 });
  }
}
