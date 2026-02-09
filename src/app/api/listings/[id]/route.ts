import { NextRequest, NextResponse } from "next/server";
import { getListingById } from "@/lib/redis";

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
    const listing = await getListingById(id);
    if (!listing) {
      return NextResponse.json({ error: "Annonsen hittades inte" }, { status: 404 });
    }
    return NextResponse.json(listing);
  } catch {
    return NextResponse.json(
      { error: "Kunde inte hämta annonsen" },
      { status: 500 }
    );
  }
}
