import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "HittaYta.se/1.0 (commercial; address suggestions)";
const LIMIT = 8;

export interface SuggestItem {
  display_name: string;
  lat: number;
  lon: number;
  city?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const encoded = encodeURIComponent(q);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=${LIMIT}&countrycodes=se`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
      address?: { city?: string; town?: string; village?: string; municipality?: string; county?: string };
    }>;

    const suggestions: SuggestItem[] = (data || []).map((item) => {
      const addr = item.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
      return {
        display_name: item.display_name || "",
        lat: parseFloat(item.lat) || 0,
        lon: parseFloat(item.lon) || 0,
        city: city || undefined,
      };
    });

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
