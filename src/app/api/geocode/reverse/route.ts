import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "HittaYta.se/1.0 (commercial; reverse geocode)";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lon") ?? searchParams.get("lng");
  const latNum = lat != null ? parseFloat(lat) : NaN;
  const lngNum = lng != null ? parseFloat(lng) : NaN;
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    return NextResponse.json({ error: "lat och lon krävs" }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latNum}&lon=${lngNum}&format=json&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ error: "Kunde inte hämta adress" }, { status: 502 });

    const data = (await res.json()) as {
      display_name?: string;
      address?: {
        road?: string;
        house_number?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        postcode?: string;
      };
    };

    const displayName = data.display_name || "";
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;

    return NextResponse.json({
      display_name: displayName,
      city: city || undefined,
      address: data.address,
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte hämta adress" }, { status: 502 });
  }
}
