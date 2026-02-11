import OpenAI from "openai";

const FETCH_TIMEOUT_MS = 8000;
const NOMINATIM_USER_AGENT = "HittaYta.se/1.0 (commercial; listing generator)";

export const VALID_TYPES = ["sale", "rent"] as const;
export const VALID_CATEGORIES = ["butik", "kontor", "lager", "ovrigt"] as const;

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

interface SmhiPointForecast {
  timeSeries?: Array<{
    validTime?: string;
    parameters?: Array<{ name: string; values: number[] }>;
  }>;
}

async function fetchSmhiWeather(lat: number, lng: number): Promise<string | null> {
  const lon = Math.round(lng * 100) / 100;
  const latR = Math.round(lat * 100) / 100;
  const url = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${latR}/data.json`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return null;
    const data = (await res.json()) as SmhiPointForecast;
    const series = data?.timeSeries;
    if (!Array.isArray(series) || series.length === 0) return null;
    const first = series[0];
    const params = first?.parameters || [];
    const temp = params.find((p) => p.name === "t");
    const tempVal = temp?.values?.[0];
    const desc: string[] = [];
    if (typeof tempVal === "number") desc.push(`medeltemperaturen cirka ${Math.round(tempVal)}°C`);
    if (desc.length > 0) return `Klimat: ${desc.join(", ")}.`;
    return "Väderdata tillgänglig för området.";
  } catch {
    return null;
  }
}

async function fetchScbDemographics(_cityName: string): Promise<string | null> {
  try {
    const tableUrl =
      "https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BE/BE0101/BE0101A/FolkmangdKommunLän";
    const body = {
      query: [
        { code: "Region", selection: { filter: "item", values: ["00"] } },
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
    const total = rows.find((r) => r.key?.[0] === "00");
    const pop = total?.values?.[0];
    if (pop) return `Sverige har cirka ${Number(pop).toLocaleString("sv-SE")} invånare (2024).`;
    return null;
  } catch {
    return null;
  }
}

const GPT_SYSTEM = `Du är en professionell fastighetsannonsförfattare i Sverige.
Skapa en säljande annons på svenska för en kommersiell lokal.
Använd informationen om området (demografi, väder, läge) för att göra annonsen trovärdig och informativ.
Strukturera beskrivningen med tydliga stycken. Var professionell men engagerande.
Svara ENDAST med en giltig JSON-objekt utan markdown eller annan text, med dessa nycklar:
- "title": sträng, max 80 tecken, säljande rubrik
- "description": sträng, 300–600 ord, flera stycken
- "tags": array av strängar, välj bland: Nyrenoverad, Centralt läge, Hög takhöjd, Parkering, Fiber, Klimatanläggning, Lastbrygga, Skyltfönster, Öppen planlösning, Mötesrum (max 10 taggar)`;

export async function generateListingContent(
  input: GenerateInput,
  openaiApiKey: string
): Promise<GenerateResult> {
  const { address, type, category, price: priceNum, size: sizeNum, highlights = "" } = input;
  const typeLabel = type === "rent" ? "uthyres" : "till salu";
  const categoryLabel = { butik: "butik", kontor: "kontor", lager: "lager", ovrigt: "övrigt" }[category];

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

  let weatherSummary: string | null = null;
  if (geocode) {
    weatherSummary = await fetchSmhiWeather(geocode.lat, geocode.lng);
  }
  const demographicsSummary = await fetchScbDemographics(city);

  const userContent = [
    `Adress: ${address.trim()}`,
    `Typ: ${typeLabel}`,
    `Kategori: ${categoryLabel}`,
    `Pris: ${priceNum.toLocaleString("sv-SE")} kr${type === "rent" ? "/mån" : ""}`,
    `Storlek: ${sizeNum} m²`,
    highlights?.trim() ? `Det hyresvärden vill lyfta: ${highlights.trim()}` : "",
    geocode ? `Plats: ${geocode.displayName}` : "",
    weatherSummary ? `Områdesinformation (väder/klimat): ${weatherSummary}` : "",
    demographicsSummary ? `Demografi: ${demographicsSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: GPT_SYSTEM },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });
  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Kunde inte generera annons");
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
    areaSummary: [weatherSummary, demographicsSummary].filter(Boolean).join(" ") || undefined,
  };
}
