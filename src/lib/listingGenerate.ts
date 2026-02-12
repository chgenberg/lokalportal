import OpenAI from "openai";

const FETCH_TIMEOUT_MS = 5000;
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
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

/** Fetch nearby amenities via Overpass API (OpenStreetMap). Returns a short summary string or null. */
async function fetchNearbyAmenities(lat: number, lng: number): Promise<string | null> {
  const query = `
[out:json][timeout:8];
(
  node["amenity"~"restaurant|cafe|bar"](around:500,${lat},${lng});
  node["shop"](around:500,${lat},${lng});
  node["amenity"~"gym|fitness_centre"](around:500,${lat},${lng});
  node["highway"="bus_stop"](around:500,${lat},${lng});
  node["railway"="station"](around:1000,${lat},${lng});
  node["amenity"="parking"](around:300,${lat},${lng});
);
out;
  `.trim();
  try {
    const res = await fetchWithTimeout("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    }, 8000);
    if (!res.ok) return null;
    const data = (await res.json()) as OverpassResponse;
    const elements = data?.elements;
    if (!Array.isArray(elements)) return null;
    let restaurants = 0, shops = 0, gyms = 0, busStops = 0, stations = 0, parking = 0;
    for (const el of elements) {
      const tags = el.tags ?? {};
      if (tags.amenity && /restaurant|cafe|bar/i.test(String(tags.amenity))) restaurants++;
      else if (tags.shop) shops++;
      else if (tags.amenity && /gym|fitness_centre/i.test(String(tags.amenity))) gyms++;
      else if (tags.highway === "bus_stop") busStops++;
      else if (tags.railway === "station") stations++;
      else if (tags.amenity === "parking") parking++;
    }
    const parts: string[] = [];
    if (restaurants > 0) parts.push(`${restaurants} restauranger/caféer`);
    if (shops > 0) parts.push(`${shops} butiker`);
    if (gyms > 0) parts.push(`${gyms} gym`);
    if (busStops > 0) parts.push(`${busStops} busshållplatser`);
    if (stations > 0) parts.push(`${stations} tågstation(er)`);
    if (parking > 0) parts.push(`${parking} parkeringar`);
    if (parts.length === 0) return null;
    return `Inom 500 m: ${parts.join(", ")}.`;
  } catch {
    return null;
  }
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

async function fetchScbDemographics(cityName: string): Promise<string | null> {
  const key = normalizeCityForLookup(cityName);
  const kommunCode = KOMMUN_CODES[key] ?? KOMMUN_CODES[key.replace(/\s+kommun$/i, "")] ?? "00";
  const isNational = kommunCode === "00";

  try {
    const tableUrl =
      "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/FolkmangdKommunLän";
    const body = {
      query: [
        { code: "Region", selection: { filter: "item", values: [kommunCode] } },
        { code: "ContentsCode", selection: { filter: "item", values: ["BE0101N1"] } },
        { code: "Tid", selection: { filter: "item", values: ["2024"] } },
      ],
      response: { format: "json" },
    };
    const res = await fetchWithTimeout(tableUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: Array<{ key: string[]; values: string[] }> };
    const rows = data?.data;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const row = rows.find((r) => r.key?.[0] === kommunCode) ?? rows[0];
    const pop = row?.values?.[0];
    if (!pop) return null;
    const num = Number(pop);
    if (Number.isNaN(num)) return null;
    if (isNational) return `Sverige har cirka ${num.toLocaleString("sv-SE")} invånare (2024).`;
    const label = cityName.trim() || "Kommunen";
    return `${label} har cirka ${num.toLocaleString("sv-SE")} invånare (2024).`;
  } catch {
    return null;
  }
}

const GPT_SYSTEM = `Du är Sveriges bästa kommersiella fastighetsannonsförfattare med 20 års erfarenhet. Din uppgift är att skriva en annons som får läsaren att vilja boka visning idag.

Svara ENDAST med ett giltigt JSON-objekt utan markdown eller annan text. Nycklar:
- "title": sträng, max 80 tecken. Börja med lokalens starkaste egenskap + plats. Exempel: "Skyltfönster mot Avenyn – 120 m² butik i Göteborg"
- "description": sträng, 200–400 ord, exakt 4 stycken:
  1. KROK: En mening som fångar. Lyft det mest unika.
  2. LOKALEN: Storlek, planlösning, skick, utrustning. Var specifik.
  3. LÄGET: Använd områdesdata (faciliteter, kommunikationer, demografi) naturligt i löpande text – inte som punktlista.
  4. AVSLUTNING: Kort CTA. Vem passar lokalen för? Varför nu?
- "tags": array av strängar, max 10 st. Välj endast bland: Nyrenoverad, Centralt läge, Hög takhöjd, Parkering, Fiber, Klimatanläggning, Lastbrygga, Skyltfönster, Öppen planlösning, Mötesrum

REGLER:
- Skriv som en människa, inte en AI. Professionell men engagerande.
- Undvik klichéer: "unik möjlighet", "perfekt för", "missa inte", "i hjärtat av".
- Var konkret: siffror och fakta framför floskler. Nämn pris och storlek naturligt i beskrivningen.`;

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

  const [demographicsSummary, amenitiesSummary] = await Promise.all([
    fetchScbDemographics(city),
    lat && lng ? fetchNearbyAmenities(lat, lng) : Promise.resolve(null),
  ]);

  const userContent = [
    `Adress: ${address.trim()}`,
    `Typ: ${typeLabel}`,
    `Kategori: ${categoryLabel}`,
    `Pris: ${priceNum.toLocaleString("sv-SE")} kr${type === "rent" ? "/mån" : ""}`,
    `Storlek: ${sizeNum} m²`,
    highlights?.trim() ? `Det hyresvärden vill lyfta: ${highlights.trim()}` : "",
    geocode ? `Plats: ${geocode.displayName}` : "",
    demographicsSummary ? `Demografi: ${demographicsSummary}` : "",
    amenitiesSummary ? `Närliggande faciliteter: ${amenitiesSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const openai = new OpenAI({ apiKey: openaiApiKey, timeout: 25_000 });

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

  // Strategy 1: Responses API with gpt-5.2
  try {
    console.log("[generate] Trying gpt-5.2 via Responses API...");
    const response = await openai.responses.create({
      model: "gpt-5.2",
      instructions: GPT_SYSTEM,
      input: userContent,
      text: {
        format: {
          type: "json_schema",
          name: "listing",
          strict: true,
          schema: JSON_SCHEMA,
        },
      },
    });
    raw = response.output_text?.trim();
    if (raw) console.log("[generate] gpt-5.2 succeeded");
  } catch (err1: unknown) {
    const msg = err1 instanceof Error ? err1.message : String(err1);
    console.warn("[generate] gpt-5.2 Responses API failed:", msg);

    // Strategy 2: Responses API with gpt-4.1-mini
    try {
      console.log("[generate] Trying gpt-4.1-mini via Responses API...");
      const response2 = await openai.responses.create({
        model: "gpt-4.1-mini",
        instructions: GPT_SYSTEM,
        input: userContent,
        text: {
          format: {
            type: "json_schema",
            name: "listing_fb",
            strict: true,
            schema: JSON_SCHEMA,
          },
        },
      });
      raw = response2.output_text?.trim();
      if (raw) console.log("[generate] gpt-4.1-mini succeeded");
    } catch (err2: unknown) {
      const msg2 = err2 instanceof Error ? err2.message : String(err2);
      console.warn("[generate] gpt-4.1-mini Responses API failed:", msg2);

      // Strategy 3: Chat Completions API fallback (widest compatibility)
      try {
        console.log("[generate] Trying gpt-4o via Chat Completions API...");
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: GPT_SYSTEM },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
          max_tokens: 1500,
        });
        raw = completion.choices[0]?.message?.content?.trim();
        if (raw) console.log("[generate] gpt-4o Chat Completions succeeded");
      } catch (err3: unknown) {
        const msg3 = err3 instanceof Error ? err3.message : String(err3);
        console.error("[generate] All strategies failed. Last error:", msg3);
        throw new Error("Kunde inte generera annons – alla modeller misslyckades");
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
  };
}
