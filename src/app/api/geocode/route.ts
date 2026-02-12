import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

const NOMINATIM_USER_AGENT = "HittaYta.se/1.0 (commercial; geocode)";
const MAX_QUERY_LENGTH = 500;

export async function GET(request: NextRequest) {
  const key = `geocode:${getClientKey(request)}`;
  const { limited, retryAfter } = checkRateLimit(key, 30);
  if (limited) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen senare." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "q krävs" }, { status: 400 });
  if (q.length > MAX_QUERY_LENGTH) return NextResponse.json({ error: "Sökningen är för lång" }, { status: 400 });

  const encoded = encodeURIComponent(q);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ error: "Kunde inte geokoda" }, { status: 502 });

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
      address?: { city?: string; town?: string; village?: string; municipality?: string; county?: string };
    }>;
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Adressen hittades inte" }, { status: 404 });
    }

    const first = data[0];
    const addr = first.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;

    return NextResponse.json({
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      display_name: first.display_name || q,
      city: city || undefined,
    });
  } catch {
    return NextResponse.json({ error: "Kunde inte geokoda" }, { status: 502 });
  }
}
