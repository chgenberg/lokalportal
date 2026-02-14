import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

const NOMINATIM_USER_AGENT = "HittaYta.se/1.0 (commercial; address suggestions)";
const MAX_QUERY_LENGTH = 500;
const LIMIT = 8;

export interface SuggestItem {
  display_name: string;
  lat: number;
  lon: number;
  city?: string;
}

/** Extract house number from query (e.g. "Södra Skjutbanevägen 10" → "10") */
function extractHouseNumberFromQuery(q: string): string | undefined {
  const m = q.match(/\s+(\d{1,4}[a-zA-Z]?)\s*$/);
  return m ? m[1] : undefined;
}

/** Swedish postcode: normalize "41118" → "411 18" */
function formatSwedishPostcode(pc: string | undefined): string | undefined {
  if (!pc || typeof pc !== "string") return undefined;
  const digits = pc.replace(/\D/g, "");
  if (digits.length === 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return pc.trim() || undefined;
}

/** Build short address: "Gatuadress, postnummer Ort" */
function buildShortAddress(
  addr: Record<string, string | undefined>,
  houseNumberFromQuery?: string
): string {
  const road = addr.road || addr.street || addr.footway;
  const houseNumber = addr.house_number || houseNumberFromQuery;
  const postcode = formatSwedishPostcode(addr.postcode ?? addr.postal_code);
  const cleanMunicipality = (s: string | undefined) => {
    if (!s) return undefined;
    const t = s.replace(/\s+kommun$/i, "").replace(/\s+Stad$/i, "").trim();
    return t.replace(/s$/, "") || t;
  };
  const locality =
    addr.city || addr.town || addr.village || cleanMunicipality(addr.municipality) || addr.suburb || addr.neighbourhood;

  const streetPart = [road, houseNumber].filter(Boolean).join(" ");
  const locationPart = [postcode, locality].filter(Boolean).join(" ");
  if (streetPart && locationPart) return `${streetPart}, ${locationPart}`;
  if (streetPart) return streetPart;
  return "";
}

export async function GET(request: NextRequest) {
  const key = `geocode-suggest:${getClientKey(request)}`;
  const { limited, retryAfter } = checkRateLimit(key, 30);
  if (limited) {
    return NextResponse.json(
      { suggestions: [], error: "För många förfrågningar" },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }
  if (q.length > MAX_QUERY_LENGTH) return NextResponse.json({ suggestions: [] });

  const houseNumberFromQuery = extractHouseNumberFromQuery(q);
  const encoded = encodeURIComponent(q);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=jsonv2&addressdetails=1&limit=${LIMIT}&countrycodes=se`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": NOMINATIM_USER_AGENT,
        "Accept-Language": "sv",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
      address?: Record<string, string>;
      addresstype?: string;
      place_rank?: number;
    }>;

    const sorted = [...(data || [])].sort((a, b) => {
      const rankA = a.place_rank ?? 0;
      const rankB = b.place_rank ?? 0;
      return rankB - rankA;
    });

    const suggestions: SuggestItem[] = sorted.map((item) => {
      const addr = item.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
      const short = buildShortAddress(addr, houseNumberFromQuery);
      const display = short || item.display_name || "";
      return {
        display_name: display,
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
