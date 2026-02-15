import OpenAI from "openai";
import type { NearbyData, PriceContext, DemographicsData, WalkabilityData, AreaContext } from "@/lib/types";
import prisma from "@/lib/db";

const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

const memCache = new Map<string, { value: unknown; expires: number }>();

function cacheGet<T>(key: string): T | undefined {
  const entry = memCache.get(key);
  if (!entry || Date.now() > entry.expires) {
    if (entry) memCache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function cacheSet(key: string, value: unknown): void {
  memCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}
const NOMINATIM_USER_AGENT = "HittaYta.se/1.0 (commercial; listing generator)";

export const VALID_TYPES = ["sale", "rent"] as const;
export const VALID_CATEGORIES = ["butik", "kontor", "lager", "restaurang", "verkstad", "showroom", "popup", "atelje", "gym", "ovrigt"] as const;

export type InputType = (typeof VALID_TYPES)[number];
export type InputCategory = (typeof VALID_CATEGORIES)[number];

export interface GenerateInput {
  address: string;
  type: InputType;
  category: InputCategory;
  price: number;
  size: number;
  highlights?: string;
  lat?: number;
  lng?: number;
  imageUrls?: string[];
}

export interface GenerateResult {
  title: string;
  description: string;
  tags: string[];
  city: string;
  address: string;
  lat: number;
  lng: number;
  type: InputType;
  category: InputCategory;
  price: number;
  size: number;
  areaSummary?: string;
  nearby: NearbyData;
  priceContext: PriceContext | null;
  demographics: DemographicsData | null;
  walkability: WalkabilityData | null;
  areaContext: AreaContext | null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
  };
}

interface GeocodeResult {
  lat: number;
  lng: number;
  city: string;
  displayName: string;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

async function fetchWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const encoded = encodeURIComponent(address.trim());
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&addressdetails=1`;
  try {
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResult[];
    if (!Array.isArray(data) || data.length === 0) return null;
    const first = data[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    const addr = first.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      address.split(",")[0]?.trim() ||
      "Okänd ort";
    return {
      lat,
      lng,
      city: String(city).slice(0, 100),
      displayName: first.display_name || address,
    };
  } catch {
    return null;
  }
}

interface OverpassElement {
  type?: string;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getName(el: OverpassElement): string {
  const tags = el.tags ?? {};
  return (
    tags.name ||
    tags["name:sv"] ||
    tags.ref ||
    ""
  ).trim();
}

/** Fetch nearby amenities via Overpass API. Returns structured NearbyData.
 * Uses both node and way (many POIs are mapped as buildings/areas in OSM).
 * Radii: 1000-1500m for better coverage in suburbs.
 * Results cached 30 min by rounded coordinates. */
async function fetchNearbyData(lat: number, lng: number): Promise<NearbyData> {
  const cacheKey = `nearby:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  const cached = cacheGet<NearbyData>(cacheKey);
  if (cached) return cached;

  const empty: NearbyData = {
    restaurants: 0,
    shops: 0,
    gyms: 0,
    busStops: { count: 0 },
    trainStations: { count: 0 },
    parking: 0,
    schools: 0,
    healthcare: 0,
  };
  const r1 = 2500;  // 2.5 km for POIs (better coverage in suburban/rural areas)
  const r2 = 3000;  // 3 km for schools, transport
  const query = `
[out:json][timeout:15];
(
  node["amenity"~"restaurant|cafe|bar"](around:${r1},${lat},${lng});
  way["amenity"~"restaurant|cafe|bar"](around:${r1},${lat},${lng});
  node["shop"](around:${r1},${lat},${lng});
  way["shop"](around:${r1},${lat},${lng});
  node["amenity"~"gym|fitness_centre|fitness_center"](around:${r1},${lat},${lng});
  way["amenity"~"gym|fitness_centre|fitness_center"](around:${r1},${lat},${lng});
  node["highway"="bus_stop"](around:${r2},${lat},${lng});
  node["public_transport"="stop_position"]["bus"="yes"](around:${r2},${lat},${lng});
  node["railway"="station"](around:${r2},${lat},${lng});
  way["railway"="station"](around:${r2},${lat},${lng});
  node["amenity"="parking"](around:${r1},${lat},${lng});
  way["amenity"="parking"](around:${r1},${lat},${lng});
  node["amenity"~"school|university|college|kindergarten"](around:${r2},${lat},${lng});
  way["amenity"~"school|university|college|kindergarten"](around:${r2},${lat},${lng});
  way["building"="school"](around:${r2},${lat},${lng});
  node["amenity"~"pharmacy|clinic|doctors|hospital"](around:${r1},${lat},${lng});
  way["amenity"~"pharmacy|clinic|doctors|hospital"](around:${r1},${lat},${lng});
);
out center;
  `.trim();
  try {
    const res = await fetchWithRetry(() =>
      fetchWithTimeout(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
        },
        12000
      )
    );
    if (!res.ok) return empty;
    const data = (await res.json()) as OverpassResponse;
    const elements = data?.elements;
    if (!Array.isArray(elements)) return empty;

    const busStopElements: OverpassElement[] = [];
    const stationElements: OverpassElement[] = [];
    let restaurants = 0,
      shops = 0,
      gyms = 0,
      busStops = 0,
      stations = 0,
      parking = 0,
      schools = 0,
      healthcare = 0;

    for (const el of elements) {
      const tags = el.tags ?? {};
      if (tags.amenity && /restaurant|cafe|bar/i.test(String(tags.amenity))) {
        restaurants++;
      } else if (tags.shop) {
        shops++;
      } else if (tags.amenity && /gym|fitness_centre|fitness_center/i.test(String(tags.amenity))) {
        gyms++;
      } else if (tags.highway === "bus_stop" || (tags.public_transport === "stop_position" && tags.bus === "yes")) {
        busStops++;
        busStopElements.push(el);
      } else if (tags.railway === "station") {
        stations++;
        stationElements.push(el);
      } else if (tags.amenity === "parking") {
        parking++;
      } else if ((tags.amenity && /school|university|college|kindergarten/i.test(String(tags.amenity))) || tags.building === "school") {
        schools++;
      } else if (tags.amenity && /pharmacy|clinic|doctors|hospital/i.test(String(tags.amenity))) {
        healthcare++;
      }
    }

    const getCoords = (e: OverpassElement): { lat: number; lng: number } | null => {
      if (e.lat != null && e.lon != null) return { lat: e.lat, lng: e.lon };
      if (e.center?.lat != null && e.center?.lon != null) return { lat: e.center.lat, lng: e.center.lon };
      return null;
    };
    const sortByDistance = (arr: OverpassElement[]): Array<{ el: OverpassElement; distance: number }> =>
      arr
        .map((e) => ({ el: e, coords: getCoords(e) }))
        .filter((x): x is { el: OverpassElement; coords: { lat: number; lng: number } } => x.coords != null)
        .map((x) => ({
          el: x.el,
          distance: Math.round(haversineDistance(lat, lng, x.coords.lat, x.coords.lng)),
        }))
        .sort((a, b) => a.distance - b.distance);
    const nearestBusEntry = sortByDistance(busStopElements)[0];
    const nearestStationEntry = sortByDistance(stationElements)[0];

    const result: NearbyData = {
      restaurants,
      shops,
      gyms,
      busStops: {
        count: busStops,
        nearest: nearestBusEntry ? getName(nearestBusEntry.el) || undefined : undefined,
        nearestDistance: nearestBusEntry?.distance,
      },
      trainStations: {
        count: stations,
        nearest: nearestStationEntry ? getName(nearestStationEntry.el) || undefined : undefined,
        nearestDistance: nearestStationEntry?.distance,
      },
      parking,
      schools,
      healthcare,
    };
    cacheSet(cacheKey, result);
    return result;
  } catch {
    return empty;
  }
}

/** Build summary string from NearbyData for GPT prompt */
function nearbyToSummary(nearby: NearbyData): string | null {
  const parts: string[] = [];
  if (nearby.restaurants > 0) parts.push(`${nearby.restaurants} restauranger/caféer`);
  if (nearby.shops > 0) parts.push(`${nearby.shops} butiker`);
  if (nearby.gyms > 0) parts.push(`${nearby.gyms} gym`);
  if (nearby.busStops.count > 0) parts.push(`${nearby.busStops.count} busshållplatser`);
  if (nearby.trainStations.count > 0) parts.push(`${nearby.trainStations.count} tågstation(er)`);
  if (nearby.parking > 0) parts.push(`${nearby.parking} parkeringar`);
  if (nearby.schools > 0) parts.push(`${nearby.schools} skolor`);
  if (nearby.healthcare > 0) parts.push(`${nearby.healthcare} vård/apotek`);
  if (parts.length === 0) return null;
  return `Inom 2,5 km: ${parts.join(", ")}.`;
}

// ---------------------------------------------------------------------------
// Walkability / Bikeability score (calculated from Overpass data)
// ---------------------------------------------------------------------------

function scoreLabel(score: number): string {
  if (score >= 90) return "Utmärkt";
  if (score >= 70) return "Mycket bra";
  if (score >= 50) return "Bra";
  if (score >= 25) return "Godkänt";
  return "Bilberoende";
}

/**
 * Calculate walkability & bikeability scores from OSM infrastructure data.
 * Uses a separate Overpass query for pedestrian/cycling infrastructure within 1 km.
 * Score 0-100 based on density of sidewalks, footways, cycleways, crossings,
 * combined with nearby amenity counts from NearbyData.
 */
async function fetchWalkabilityData(
  lat: number,
  lng: number,
  nearby: NearbyData
): Promise<WalkabilityData> {
  const cacheKey = `walk:${lat.toFixed(3)}:${lng.toFixed(3)}`;
  const cached = cacheGet<WalkabilityData>(cacheKey);
  if (cached) return cached;

  const fallback: WalkabilityData = {
    walkScore: 0,
    bikeScore: 0,
    walkLabel: "Bilberoende",
    bikeLabel: "Bilberoende",
    cycleways: 0,
    footways: 0,
  };

  const r = 1000; // 1 km radius for infrastructure
  const query = `
[out:json][timeout:10];
(
  way["highway"="cycleway"](around:${r},${lat},${lng});
  way["cycleway"](around:${r},${lat},${lng});
  way["bicycle"="designated"](around:${r},${lat},${lng});
  way["highway"="footway"](around:${r},${lat},${lng});
  way["highway"="pedestrian"](around:${r},${lat},${lng});
  way["foot"="designated"](around:${r},${lat},${lng});
  node["highway"="crossing"](around:${r},${lat},${lng});
  way["sidewalk"~"both|left|right"](around:${r},${lat},${lng});
);
out tags;
  `.trim();

  try {
    const res = await fetchWithRetry(() =>
      fetchWithTimeout(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
        },
        10000
      )
    );
    if (!res.ok) return fallback;
    const data = await res.json();

    // With "out count", Overpass returns elements array with count info
    // or we parse the total from the response
    let cycleways = 0;
    let footways = 0;
    let crossings = 0;
    let sidewalks = 0;

    if (data?.elements && Array.isArray(data.elements)) {
      for (const el of data.elements as OverpassElement[]) {
        const tags = el.tags ?? {};
        if (tags.highway === "cycleway" || tags.cycleway || tags.bicycle === "designated") {
          cycleways++;
        } else if (tags.highway === "footway" || tags.highway === "pedestrian" || tags.foot === "designated") {
          footways++;
        } else if (tags.highway === "crossing") {
          crossings++;
        } else if (tags.sidewalk && /both|left|right/i.test(String(tags.sidewalk))) {
          sidewalks++;
        }
      }
    }

    // Walk score: based on footways, crossings, sidewalks, and nearby amenities
    const amenityCount =
      nearby.restaurants +
      nearby.shops +
      nearby.healthcare +
      nearby.schools +
      nearby.busStops.count +
      nearby.trainStations.count;

    // Infrastructure component (max 50 points)
    const walkInfra = Math.min(50, (footways * 2) + (crossings * 3) + (sidewalks * 2));
    // Amenity component (max 50 points)
    const walkAmenity = Math.min(50, amenityCount * 2);
    const walkScore = Math.min(100, walkInfra + walkAmenity);

    // Bike score: based on cycleways and general infrastructure
    const bikeInfra = Math.min(60, cycleways * 4);
    const bikeAmenity = Math.min(40, amenityCount * 1.5);
    const bikeScore = Math.min(100, Math.round(bikeInfra + bikeAmenity));

    const result: WalkabilityData = {
      walkScore: Math.round(walkScore),
      bikeScore,
      walkLabel: scoreLabel(walkScore),
      bikeLabel: scoreLabel(bikeScore),
      cycleways,
      footways,
    };
    cacheSet(cacheKey, result);
    return result;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Wikipedia area context (Swedish Wikipedia, no account needed)
// ---------------------------------------------------------------------------

/**
 * Fetch a short summary about the area/district from Swedish Wikipedia.
 * Tries the city + district name first, then falls back to just the city.
 * Uses the Wikipedia REST API (no auth required).
 */
async function fetchAreaContext(
  city: string,
  address: string
): Promise<AreaContext | null> {
  const cacheKey = `wiki:${city.toLowerCase()}:${address.toLowerCase().slice(0, 30)}`;
  const cached = cacheGet<AreaContext | null>(cacheKey);
  if (cached !== undefined) return cached;

  // Try to extract a district/area name from the address
  // Swedish addresses: "Storgatan 5, Södermalm" or "Kungsgatan 10"
  const parts = address.split(",").map((p) => p.trim());
  const searchTerms: string[] = [];

  // If address has a district part, try that + city
  if (parts.length > 1) {
    const district = parts[parts.length - 1];
    if (district && district !== city) {
      searchTerms.push(`${district} ${city}`);
      searchTerms.push(district);
    }
  }
  searchTerms.push(city);

  for (const term of searchTerms) {
    try {
      // Use Swedish Wikipedia search API
      const searchUrl = `https://sv.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=1&format=json&origin=*`;
      const searchRes = await fetchWithTimeout(searchUrl, {}, 5000);
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const firstResult = searchData?.query?.search?.[0];
      if (!firstResult?.title) continue;

      const title = firstResult.title as string;

      // Get the summary via the REST API
      const summaryUrl = `https://sv.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryRes = await fetchWithTimeout(summaryUrl, {}, 5000);
      if (!summaryRes.ok) continue;
      const summaryData = await summaryRes.json();

      const extract = summaryData?.extract as string | undefined;
      if (!extract || extract.length < 30) continue;

      // Truncate to ~300 chars at a sentence boundary
      let summary = extract;
      if (summary.length > 350) {
        const cutoff = summary.lastIndexOf(".", 350);
        summary = cutoff > 100 ? summary.slice(0, cutoff + 1) : summary.slice(0, 350) + "…";
      }

      const result: AreaContext = {
        summary,
        title,
        url: `https://sv.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      };
      cacheSet(cacheKey, result);
      return result;
    } catch {
      continue;
    }
  }

  cacheSet(cacheKey, null);
  return null;
}

/** SCB kommunkoder (4 siffror) för kommunspecifik befolkning. Normaliserad stadskey = lowercase, utan diakritika. */
const KOMMUN_CODES: Record<string, string> = {
  stockholm: "0180",
  göteborg: "1480",
  goteborg: "1480",
  malmö: "1280",
  malmo: "1280",
  uppsala: "0380",
  västerås: "1980",
  vasteras: "1980",
  örebro: "1880",
  orebro: "1880",
  linköping: "0580",
  linkoping: "0580",
  helsingborg: "1283",
  norrköping: "0581",
  norrkoping: "0581",
  jönköping: "0680",
  jonkoping: "0680",
  umeå: "2480",
  umea: "2480",
  lund: "1281",
  borås: "1490",
  boras: "1490",
  sundsvall: "2281",
  gävle: "2180",
  gavle: "2180",
  eskilstuna: "0484",
  södertälje: "0181",
  sodertalje: "0181",
  karlstad: "1780",
  täby: "0160",
  taby: "0160",
  växjö: "0780",
  vaxjo: "0780",
  halmstad: "1380",
  luleå: "2580",
  lulea: "2580",
  trollhättan: "1488",
  trollhattan: "1488",
  östersund: "2380",
  ostersund: "2380",
  borlänge: "2081",
  borlange: "2081",
  falun: "2080",
  kalmar: "0880",
  kristianstad: "1290",
  skövde: "1496",
  skovde: "1496",
  uddevalla: "1485",
  varberg: "1383",
  nyköping: "0482",
  nykoping: "0482",
  landskrona: "1282",
  motala: "0583",
  lidköping: "1494",
  lidkoping: "1494",
  visby: "0980",
};

function normalizeCityForLookup(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/** Reported crimes per 100 000 inhabitants (BRÅ 2024, approximate).
 * Sources: bra.se/statistik – anmälda brott per kommun 2024.
 * We store values for the ~50 most common municipalities; others default to the national average. */
const BRA_CRIME_RATE: Record<string, number> = {
  "0180": 16200, // Stockholm
  "1480": 14800, // Göteborg
  "1280": 15900, // Malmö
  "0380": 12700, // Uppsala
  "1980": 12000, // Västerås
  "1880": 12200, // Örebro
  "0580": 11100, // Linköping
  "1283": 14100, // Helsingborg
  "0581": 12600, // Norrköping
  "0680": 10900, // Jönköping
  "2480": 11500, // Umeå
  "1281": 11200, // Lund
  "1490": 12400, // Borås
  "2281": 12100, // Sundsvall
  "2180": 12300, // Gävle
  "0484": 12800, // Eskilstuna
  "0181": 11900, // Södertälje
  "1780": 11000, // Karlstad
  "0160": 8200,  // Täby
  "0780": 11300, // Växjö
  "1380": 11700, // Halmstad
  "2580": 11600, // Luleå
  "1488": 12500, // Trollhättan
  "2380": 11400, // Östersund
  "2081": 12000, // Borlänge
  "2080": 11100, // Falun
  "0880": 10800, // Kalmar
  "1290": 11800, // Kristianstad
  "1496": 10600, // Skövde
  "1485": 11500, // Uddevalla
  "1383": 10400, // Varberg
  "0482": 11200, // Nyköping
  "1282": 13200, // Landskrona
  "0583": 10900, // Motala
  "1494": 9800,  // Lidköping
  "0980": 11500, // Visby
};
const BRA_NATIONAL_AVERAGE = 14200; // Approximate national average per 100 000 (2024)

/** Median income in tkr/year per municipality (SCB HE0110, sammanräknad förvärvsinkomst, 2023).
 * Source: statistikdatabasen.scb.se. Values are median (tkr). */
const MEDIAN_INCOME: Record<string, number> = {
  "0180": 366, // Stockholm
  "1480": 320, // Göteborg
  "1280": 274, // Malmö
  "0380": 316, // Uppsala
  "1980": 302, // Västerås
  "1880": 296, // Örebro
  "0580": 318, // Linköping
  "1283": 283, // Helsingborg
  "0581": 282, // Norrköping
  "0680": 310, // Jönköping
  "2480": 308, // Umeå
  "1281": 296, // Lund
  "1490": 294, // Borås
  "2281": 296, // Sundsvall
  "2180": 288, // Gävle
  "0484": 280, // Eskilstuna
  "0181": 286, // Södertälje
  "1780": 298, // Karlstad
  "0160": 440, // Täby
  "0780": 296, // Växjö
  "1380": 298, // Halmstad
  "2580": 314, // Luleå
  "1488": 294, // Trollhättan
  "2380": 296, // Östersund
  "2081": 278, // Borlänge
  "2080": 302, // Falun
  "0880": 286, // Kalmar
  "1290": 278, // Kristianstad
  "1496": 292, // Skövde
  "1485": 282, // Uddevalla
  "1383": 312, // Varberg
  "0482": 290, // Nyköping
  "1282": 262, // Landskrona
  "0583": 288, // Motala
  "1494": 296, // Lidköping
  "0980": 290, // Visby
};

/** Working-age population share (20–64) per municipality (SCB, 2024).
 * Source: statistikdatabasen.scb.se / BefolkningNy. Percentage. */
const WORKING_AGE_PERCENT: Record<string, number> = {
  "0180": 60, // Stockholm
  "1480": 58, // Göteborg
  "1280": 59, // Malmö
  "0380": 58, // Uppsala
  "1980": 55, // Västerås
  "1880": 56, // Örebro
  "0580": 57, // Linköping
  "1283": 56, // Helsingborg
  "0581": 55, // Norrköping
  "0680": 56, // Jönköping
  "2480": 58, // Umeå
  "1281": 60, // Lund
  "1490": 55, // Borås
  "2281": 54, // Sundsvall
  "2180": 54, // Gävle
  "0484": 55, // Eskilstuna
  "0181": 57, // Södertälje
  "1780": 56, // Karlstad
  "0160": 55, // Täby
  "0780": 57, // Växjö
  "1380": 55, // Halmstad
  "2580": 56, // Luleå
  "1488": 55, // Trollhättan
  "2380": 55, // Östersund
  "2081": 55, // Borlänge
  "2080": 54, // Falun
  "0880": 54, // Kalmar
  "1290": 54, // Kristianstad
  "1496": 55, // Skövde
  "1485": 54, // Uddevalla
  "1383": 55, // Varberg
  "0482": 53, // Nyköping
  "1282": 56, // Landskrona
  "0583": 53, // Motala
  "1494": 54, // Lidköping
  "0980": 55, // Visby
};

/** Approximate total registered businesses per municipality (SCB FDB 2024).
 * Source: SCB Företagsdatabasen. Numbers rounded to nearest 100. */
const BUSINESS_COUNTS: Record<string, number> = {
  "0180": 140200, // Stockholm
  "1480": 55400,  // Göteborg
  "1280": 30800,  // Malmö
  "0380": 20900,  // Uppsala
  "1980": 12600,  // Västerås
  "1880": 13400,  // Örebro
  "0580": 14200,  // Linköping
  "1283": 12700,  // Helsingborg
  "0581": 11200,  // Norrköping
  "0680": 12400,  // Jönköping
  "2480": 11600,  // Umeå
  "1281": 10700,  // Lund
  "1490": 9700,   // Borås
  "2281": 8700,   // Sundsvall
  "2180": 8500,   // Gävle
  "0484": 8300,   // Eskilstuna
  "0181": 7900,   // Södertälje
  "1780": 8200,   // Karlstad
  "0160": 7800,   // Täby
  "0780": 8400,   // Växjö
  "1380": 8900,   // Halmstad
  "2580": 6500,   // Luleå
  "1488": 4800,   // Trollhättan
  "2380": 5400,   // Östersund
  "2081": 4100,   // Borlänge
  "2080": 5100,   // Falun
  "0880": 6200,   // Kalmar
  "1290": 7200,   // Kristianstad
  "1496": 4600,   // Skövde
  "1485": 4700,   // Uddevalla
  "1383": 5800,   // Varberg
  "0482": 4700,   // Nyköping
  "1282": 3600,   // Landskrona
  "0583": 3700,   // Motala
  "1494": 3400,   // Lidköping
  "0980": 4900,   // Visby
};

interface ScbJsonResponse {
  data?: Array<{ key: string[]; values: string[] }>;
}

async function fetchScbDemographics(cityName: string): Promise<DemographicsData | null> {
  const key = normalizeCityForLookup(cityName);
  const kommunCode = KOMMUN_CODES[key] ?? KOMMUN_CODES[key.replace(/\s+kommun$/i, "")] ?? "00";
  const label = cityName.trim() || "Kommunen";

  const cacheKey = `demographics:${kommunCode}`;
  const cached = cacheGet<DemographicsData>(cacheKey);
  if (cached) return cached;

  // --- 1. Population ---
  let population: number | null = null;
  try {
    const popUrl =
      "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/FolkmangdKommunLän";
    const popBody = {
      query: [
        { code: "Region", selection: { filter: "item", values: [kommunCode] } },
        { code: "ContentsCode", selection: { filter: "item", values: ["BE0101N1"] } },
        { code: "Tid", selection: { filter: "item", values: ["2024"] } },
      ],
      response: { format: "json" },
    };
    const res = await fetchWithRetry(() =>
      fetchWithTimeout(popUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(popBody),
      })
    );
    if (res.ok) {
      const data = (await res.json()) as ScbJsonResponse;
      const rows = data?.data;
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows.find((r) => r.key?.[0] === kommunCode) ?? rows[0];
        const val = Number(row?.values?.[0]);
        if (!Number.isNaN(val) && val > 0) population = val;
      }
    }
  } catch {
    /* ignore */
  }

  if (!population) return null; // No point continuing without population

  // --- 2–4. Static lookups for income, age, businesses (faster + more reliable than API) ---
  const medianIncome = MEDIAN_INCOME[kommunCode];
  const workingAgePercent = WORKING_AGE_PERCENT[kommunCode];
  const totalBusinesses = BUSINESS_COUNTS[kommunCode];

  // --- 5. BRÅ crime rate (static lookup) ---
  const crimeRate = BRA_CRIME_RATE[kommunCode] ?? BRA_NATIONAL_AVERAGE;

  const result: DemographicsData = {
    population,
    city: label,
    medianIncome,
    workingAgePercent,
    totalBusinesses,
    crimeRate,
  };
  cacheSet(cacheKey, result);
  return result;
}

const EMPTY_NEARBY: NearbyData = {
  restaurants: 0,
  shops: 0,
  gyms: 0,
  busStops: { count: 0 },
  trainStations: { count: 0 },
  parking: 0,
  schools: 0,
  healthcare: 0,
};

/** Fetches demographics and nearby data for a listing. Used by listing detail page. */
export async function fetchAreaData(
  city: string,
  lat: number,
  lng: number,
  address?: string
): Promise<{ demographics: DemographicsData | null; nearby: NearbyData; walkability: WalkabilityData | null; areaContext: AreaContext | null }> {
  const [demographics, nearby, areaContext] = await Promise.all([
    fetchScbDemographics(city),
    lat && lng ? fetchNearbyData(lat, lng) : Promise.resolve(EMPTY_NEARBY),
    fetchAreaContext(city, address || city),
  ]);
  const nearbyResolved = nearby ?? EMPTY_NEARBY;
  const walkability = lat && lng ? await fetchWalkabilityData(lat, lng, nearbyResolved) : null;
  return { demographics, nearby: nearbyResolved, walkability, areaContext };
}

/** Fetch price context from comparable listings in same city/category/type */
export async function fetchAreaPriceContext(
  city: string,
  category: string,
  type: string
): Promise<PriceContext | null> {
  try {
    const primaryCategory = category.split(",")[0]?.trim() || category;
    const listings = await prisma.listing.findMany({
      where: {
        city: { equals: city, mode: "insensitive" },
        type,
        category: { contains: primaryCategory },
      },
      select: { price: true },
      take: 500,
    });
    if (listings.length < 2) return null;
    const prices = listings.map((l) => l.price).sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const medianPrice =
      prices.length % 2 === 0
        ? Math.round((prices[mid - 1]! + prices[mid]!) / 2)
        : prices[mid]!;
    return {
      medianPrice,
      count: listings.length,
      minPrice: prices[0]!,
      maxPrice: prices[prices.length - 1]!,
    };
  } catch {
    return null;
  }
}

const GPT_SYSTEM = `Du är Sveriges bästa kommersiella fastighetsannonsförfattare med 20 års erfarenhet. Din uppgift är att skriva en annons som får läsaren att vilja boka visning idag.

Svara ENDAST med ett giltigt JSON-objekt utan markdown eller annan text. Nycklar:
- "title": sträng, max 80 tecken. Börja med lokalens starkaste egenskap + plats. Exempel: "Skyltfönster mot Avenyn – 120 m² butik i Göteborg"
- "description": sträng, 250–450 ord, exakt 5 stycken:
  1. KROK: En mening som fångar. Lyft det mest unika.
  2. LOKALEN: Storlek, planlösning, skick, utrustning. Var specifik.
  3. LÄGET: Använd områdesdata (faciliteter, kommunikationer, demografi) naturligt i löpande text – inte som punktlista.
  4. OMRÅDET: Väv in ekonomisk data och trygghet – medianinkomst, arbetsför befolkning, antal företag och brottsstatistik – på ett nyanserat och säljande sätt. Om inkomsten eller företagstätheten är hög: lyft köpkraft och affärsklimat. Om brottsligheten är under rikssnittet: nämn trygghet som en fördel.
  5. AVSLUTNING: Kort CTA. Vem passar lokalen för? Varför nu?
- "tags": array av strängar, max 10 st. Välj endast bland: Nyrenoverad, Centralt läge, Hög takhöjd, Parkering, Fiber, Klimatanläggning, Lastbrygga, Skyltfönster, Öppen planlösning, Mötesrum, Nära kollektivtrafik, Gångavstånd till restauranger, Tryggt läge, Nära centrum. Välj "Nära kollektivtrafik" om det finns busshållplatser eller tågstation i närheten. Välj "Gångavstånd till restauranger" om det finns restauranger i området. Välj "Tryggt läge" endast om brottsstatistiken är under rikssnittet. Välj "Nära centrum" om lokalen ligger centralt.

REGLER:
- Skriv som en människa. Professionell men engagerande.
- Undvik klichéer: "unik möjlighet", "perfekt för", "missa inte", "i hjärtat av".
- Var konkret: siffror och fakta framför floskler. Nämn pris och storlek naturligt i beskrivningen.
- Nämn aldrig "brott" eller "brottslighet" rakt av. Använd ord som "trygg", "säker", "lugn" om siffrorna stödjer det.`;

export async function generateListingContent(
  input: GenerateInput,
  openaiApiKey: string
): Promise<GenerateResult> {
  const { address, type, category, price: priceNum, size: sizeNum, highlights = "" } = input;
  const typeLabel = type === "rent" ? "uthyres" : "till salu";
  const catLabels: Record<string, string> = { butik: "butik", kontor: "kontor", lager: "lager", restaurang: "restaurang/café", verkstad: "verkstad/industri", showroom: "showroom", popup: "pop-up", atelje: "ateljé/studio", gym: "gym/träningslokal", ovrigt: "övrigt" };
  const categoryLabel = catLabels[category] ?? category;

  const hasBodyCoords =
    input.lat != null &&
    input.lng != null &&
    !Number.isNaN(Number(input.lat)) &&
    !Number.isNaN(Number(input.lng)) &&
    Number(input.lat) >= -90 &&
    Number(input.lat) <= 90 &&
    Number(input.lng) >= -180 &&
    Number(input.lng) <= 180;

  let geocode: GeocodeResult | null = null;
  let city: string;
  let lat: number;
  let lng: number;

  if (hasBodyCoords) {
    lat = Number(input.lat);
    lng = Number(input.lng);
    const parts = address.trim().split(",").map((p) => p.trim()).filter(Boolean);
    city = parts.length > 1 ? (parts[parts.length - 1] ?? parts[0] ?? "Okänd ort") : (parts[0] ?? "Okänd ort");
    city = city.slice(0, 100);
  } else {
    geocode = await geocodeAddress(address);
    city = geocode?.city ?? address.split(",")[0]?.trim() ?? "Okänd ort";
    lat = geocode?.lat ?? 0;
    lng = geocode?.lng ?? 0;
  }

  const primaryCategory = category.split(",")[0]?.trim() || category;
  const [demographics, nearby, priceContext, areaContext] = await Promise.all([
    fetchScbDemographics(city),
    lat && lng ? fetchNearbyData(lat, lng) : Promise.resolve(null),
    fetchAreaPriceContext(city, primaryCategory, type),
    fetchAreaContext(city, address),
  ]);

  const nearbyResolved = nearby ?? {
    restaurants: 0,
    shops: 0,
    gyms: 0,
    busStops: { count: 0 },
    trainStations: { count: 0 },
    parking: 0,
    schools: 0,
    healthcare: 0,
  };

  // Walkability depends on nearby data, so fetch after
  const walkability = lat && lng
    ? await fetchWalkabilityData(lat, lng, nearbyResolved)
    : null;

  const demographicsParts: string[] = [];
  if (demographics) {
    demographicsParts.push(
      `${demographics.city} har cirka ${demographics.population.toLocaleString("sv-SE")} invånare (2024).`
    );
    if (demographics.medianIncome) {
      demographicsParts.push(
        `Medianinkomst: ${demographics.medianIncome} tkr/år.`
      );
    }
    if (demographics.workingAgePercent) {
      demographicsParts.push(
        `Andel i arbetsför ålder (20–64): ${demographics.workingAgePercent}%.`
      );
    }
    if (demographics.totalBusinesses) {
      demographicsParts.push(
        `Antal registrerade företag i kommunen: ${demographics.totalBusinesses.toLocaleString("sv-SE")}.`
      );
    }
    if (demographics.crimeRate) {
      demographicsParts.push(
        `Anmälda brott per 100 000 inv.: ${demographics.crimeRate.toLocaleString("sv-SE")} (2024, BRÅ).`
      );
    }
  }
  const demographicsSummary = demographicsParts.length > 0 ? demographicsParts.join(" ") : null;
  const amenitiesSummary = nearbyToSummary(nearbyResolved);

  // Build economic/safety context line for the AI
  const econParts: string[] = [];
  if (demographics?.medianIncome) {
    econParts.push(`medianinkomst ${demographics.medianIncome} tkr/år`);
  }
  if (demographics?.workingAgePercent) {
    econParts.push(`${demographics.workingAgePercent}% i arbetsför ålder`);
  }
  if (demographics?.totalBusinesses) {
    econParts.push(`${demographics.totalBusinesses.toLocaleString("sv-SE")} registrerade företag`);
  }
  if (demographics?.crimeRate) {
    const relation = demographics.crimeRate < BRA_NATIONAL_AVERAGE ? "under" : "över";
    econParts.push(
      `${demographics.crimeRate.toLocaleString("sv-SE")} anmälda brott/100 000 inv. (${relation} rikssnittet ${BRA_NATIONAL_AVERAGE.toLocaleString("sv-SE")})`
    );
  }
  const econSummary = econParts.length > 0 ? `Ekonomi & trygghet: ${econParts.join(", ")}.` : "";

  const pricePerSqm = sizeNum > 0 ? Math.round(priceNum / sizeNum) : 0;
  const pricePerSqmLabel = pricePerSqm > 0
    ? `Pris per m²: ${pricePerSqm.toLocaleString("sv-SE")} kr${type === "rent" ? "/m²/mån" : "/m²"}`
    : "";

  const userContentParts = [
    `Adress: ${address.trim()}`,
    `Typ: ${typeLabel}`,
    `Kategori: ${categoryLabel}`,
    `Pris: ${priceNum.toLocaleString("sv-SE")} kr${type === "rent" ? "/mån" : ""}`,
    `Storlek: ${sizeNum} m²`,
    pricePerSqmLabel,
    highlights?.trim() ? `Det hyresvärden vill lyfta: ${highlights.trim()}` : "",
    geocode ? `Plats: ${geocode.displayName}` : "",
    demographicsSummary ? `Demografi: ${demographicsSummary}` : "",
    econSummary,
    amenitiesSummary ? `Närliggande faciliteter: ${amenitiesSummary}` : "",
  ];
  if (priceContext && priceContext.count >= 2) {
    userContentParts.push(
      `Marknadsjämförelse: Medianpris i ${city} för liknande lokaler: ${priceContext.medianPrice.toLocaleString("sv-SE")} kr${type === "rent" ? "/mån" : ""}. Antal aktiva annonser: ${priceContext.count}. Prisspann: ${priceContext.minPrice.toLocaleString("sv-SE")}–${priceContext.maxPrice.toLocaleString("sv-SE")} kr.`
    );
  }
  const hasAnyNearby =
    nearbyResolved.restaurants > 0 ||
    nearbyResolved.shops > 0 ||
    nearbyResolved.gyms > 0 ||
    nearbyResolved.busStops.count > 0 ||
    nearbyResolved.trainStations.count > 0 ||
    nearbyResolved.parking > 0 ||
    nearbyResolved.schools > 0 ||
    nearbyResolved.healthcare > 0;
  if (hasAnyNearby) {
    userContentParts.push(
      `Använd dessa exakta antal i beskrivningen: ${nearbyResolved.restaurants} restauranger, ${nearbyResolved.shops} butiker, ${nearbyResolved.gyms} gym, ${nearbyResolved.busStops.count} busshållplatser, ${nearbyResolved.trainStations.count} tågstationer, ${nearbyResolved.parking} parkeringar, ${nearbyResolved.schools} skolor, ${nearbyResolved.healthcare} vård/apotek.`
    );
    const nearestParts: string[] = [];
    if (nearbyResolved.busStops.nearest && nearbyResolved.busStops.nearestDistance != null) {
      nearestParts.push(
        `Närmaste busshållplats: ${nearbyResolved.busStops.nearest} (${nearbyResolved.busStops.nearestDistance} m)`
      );
    }
    if (nearbyResolved.trainStations.nearest && nearbyResolved.trainStations.nearestDistance != null) {
      nearestParts.push(
        `Närmaste tågstation: ${nearbyResolved.trainStations.nearest} (${nearbyResolved.trainStations.nearestDistance} m)`
      );
    }
    if (nearestParts.length > 0) {
      userContentParts.push(
        `Använd dessa specifika platser i lägesstycket: ${nearestParts.join(". ")}.`
      );
    }
  } else {
    userContentParts.push(
      "Ingen detaljerad platsdata tillgänglig – nämn inte antal butiker/skolor/faciliteter. Fokusera på lokalens egenskaper, läge och pris."
    );
  }

  // Add walkability/bikeability data
  if (walkability && (walkability.walkScore > 0 || walkability.bikeScore > 0)) {
    userContentParts.push(
      `Gångvänlighet: ${walkability.walkScore}/100 (${walkability.walkLabel}). Cykelvänlighet: ${walkability.bikeScore}/100 (${walkability.bikeLabel}). ${walkability.cycleways} cykelvägar och ${walkability.footways} gångvägar inom 1 km. Nämn detta i lägesbeskrivningen om poängen är 50+.`
    );
  }

  // Add Wikipedia area context
  if (areaContext) {
    userContentParts.push(
      `Områdeskontext (Wikipedia): ${areaContext.summary} Väv in relevant historisk eller kulturell kontext om området i beskrivningen om det passar.`
    );
  }

  const userContent = userContentParts.filter(Boolean).join("\n");
  const imageUrls = input.imageUrls ?? [];

  const hasLocalhostImages = imageUrls.some((u) => u.includes("localhost") || u.includes("127.0.0.1"));

  // Add vision instruction when images are provided
  const visionInstruction = imageUrls.length > 0
    ? "\n\nBILDER: Användaren har bifogat bilder av lokalen (fasad/utsida, insida, planlösning m.m.). Beskriv det du ser – fasaden, utrustning, rum, planlösning, skick – och väv in det i beskrivningen. Om det finns en planlösningsritning, beskriv rummens placering och storlek utifrån den. Var specifik om vad bilderna visar."
    : "";

  const openai = new OpenAI({ apiKey: openaiApiKey, timeout: 30_000 });

  const JSON_SCHEMA = {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      description: { type: "string" as const },
      tags: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["title", "description", "tags"] as const,
    additionalProperties: false as const,
  };

  let raw: string | undefined;

  // Strategy 0: gpt-5.2 Responses API with Vision (when images provided, skip if localhost)
  if (imageUrls.length > 0 && !hasLocalhostImages) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://hittayta.se";
      const content: Array<
        | { type: "input_text"; text: string }
        | { type: "input_image"; image_url: string; detail: "auto" }
      > = [{ type: "input_text", text: userContent + visionInstruction }];
      for (const u of imageUrls.slice(0, 10)) {
        const url = u.startsWith("http") ? u : `${baseUrl}${u.startsWith("/") ? "" : "/"}${u}`;
        content.push({ type: "input_image", image_url: url, detail: "auto" });
      }
      console.log("[generate] Using gpt-5.2 Responses API with", content.length - 1, "images");
      const response = await openai.responses.create({
        model: "gpt-5.2",
        instructions: GPT_SYSTEM,
        input: [{ type: "message", role: "user", content }],
        text: {
          format: {
            type: "json_schema",
            name: "listing",
            strict: true,
            schema: JSON_SCHEMA,
          },
        },
        max_output_tokens: 1500,
      });
      raw = response.output_text?.trim();
      if (raw) console.log("[generate] gpt-5.2 Vision succeeded");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[generate] gpt-5.2 Vision failed:", msg);
    }
  }

  // Strategy 1: gpt-5.2 Responses API (text-only)
  if (!raw) {
    try {
      console.log("[generate] Trying gpt-5.2 Responses API (text)...");
      const response = await openai.responses.create({
        model: "gpt-5.2",
        instructions: GPT_SYSTEM,
        input: userContent + (hasLocalhostImages ? visionInstruction : ""),
        text: {
          format: {
            type: "json_schema",
            name: "listing",
            strict: true,
            schema: JSON_SCHEMA,
          },
        },
        max_output_tokens: 1500,
      });
      raw = response.output_text?.trim();
      if (raw) console.log("[generate] gpt-5.2 succeeded");
    } catch (err1: unknown) {
      const msg = err1 instanceof Error ? err1.message : String(err1);
      console.warn("[generate] gpt-5.2 failed:", msg);

      // Strategy 2: gpt-4o Chat Completions fallback
      try {
        console.log("[generate] Fallback: gpt-4o Chat Completions...");
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: GPT_SYSTEM },
            { role: "user", content: userContent + (hasLocalhostImages ? visionInstruction : "") },
          ],
          response_format: { type: "json_object" },
          max_tokens: 1500,
        });
        raw = completion.choices[0]?.message?.content?.trim();
        if (raw) console.log("[generate] gpt-4o fallback succeeded");
      } catch (err2: unknown) {
        const msg2 = err2 instanceof Error ? err2.message : String(err2);
        console.error("[generate] All strategies failed. Last error:", msg2);
        throw new Error("Kunde inte generera annons. Försök igen senare.");
      }
    }
  }
  if (!raw) throw new Error("Kunde inte generera annons – tomt svar");
  const parsed = JSON.parse(raw) as { title?: string; description?: string; tags?: string[] };
  const title = String(parsed.title ?? "").trim().slice(0, 200) || "Kommersiell lokal";
  const description = String(parsed.description ?? "").trim().slice(0, 5000) || "";
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags
        .filter((t): t is string => typeof t === "string")
        .map((t) => t.trim().slice(0, 50))
        .slice(0, 20)
    : [];

  return {
    title,
    description,
    tags,
    city: city.slice(0, 100),
    address: address.trim().slice(0, 300),
    lat,
    lng,
    type,
    category,
    price: Math.floor(priceNum),
    size: Math.floor(sizeNum),
    areaSummary: [demographicsSummary, amenitiesSummary].filter(Boolean).join(" ") || undefined,
    nearby: nearbyResolved,
    priceContext: priceContext ?? null,
    demographics: demographics ?? null,
    walkability: walkability ?? null,
    areaContext: areaContext ?? null,
  };
}
