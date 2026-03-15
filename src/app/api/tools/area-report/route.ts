import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import {
  geocodeAddress,
  fetchAreaData,
  fetchAreaPriceContext,
} from "@/lib/listingGenerate";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const key = `area-report:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, 6);
  if (limited) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen om en stund." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const { email, address } = body;

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Giltig e-post krävs" }, { status: 400 });
  }
  if (!address || typeof address !== "string" || !address.trim()) {
    return NextResponse.json({ error: "Adress krävs" }, { status: 400 });
  }

  try {
    const geocode = await geocodeAddress(address.trim());
    const city = geocode?.city ?? address.split(",")[0]?.trim() ?? "Okänd ort";
    const lat = geocode?.lat ?? 0;
    const lng = geocode?.lng ?? 0;

    const [areaData, priceContextSale] = await Promise.all([
      lat && lng ? fetchAreaData(city, lat, lng, address.trim()) : Promise.resolve(null),
      fetchAreaPriceContext(city, "lagenhet", "sale"),
    ]);

    const demographics = areaData?.demographics ?? null;
    const nearby = areaData?.nearby ?? null;
    const areaContext = areaData?.areaContext ?? null;

    let aiAnalysis = "";
    if (apiKey?.trim()) {
      try {
        const openai = new OpenAI({ apiKey, timeout: 20_000 });

        const facts = [
          `Adress: ${address.trim()}`,
          `Stad/kommun: ${city}`,
          demographics ? `Befolkning: ${demographics.population.toLocaleString("sv-SE")}` : "",
          demographics?.medianIncome ? `Medianinkomst: ${demographics.medianIncome} tkr/år` : "",
          demographics?.workingAgePercent ? `Arbetsför befolkning (20-64): ${demographics.workingAgePercent}%` : "",
          demographics?.totalBusinesses ? `Antal företag: ${demographics.totalBusinesses.toLocaleString("sv-SE")}` : "",
          demographics?.crimeRate ? `Anmälda brott per 100 000 inv.: ${demographics.crimeRate.toLocaleString("sv-SE")}` : "",
          nearby ? `Restauranger i närheten: ${nearby.restaurants}` : "",
          nearby ? `Butiker: ${nearby.shops}, Gym: ${nearby.gyms}` : "",
          nearby?.busStops ? `Busshållplatser: ${nearby.busStops.count}${nearby.busStops.nearest ? ` (närmaste: ${nearby.busStops.nearest})` : ""}` : "",
          nearby?.trainStations ? `Tågstationer: ${nearby.trainStations.count}${nearby.trainStations.nearest ? ` (närmaste: ${nearby.trainStations.nearest})` : ""}` : "",
          nearby ? `Parkering: ${nearby.parking}, Skolor: ${nearby.schools}, Sjukvård: ${nearby.healthcare}` : "",
          priceContextSale ? `Medianpris bostad: ${priceContextSale.medianPrice.toLocaleString("sv-SE")} kr (${priceContextSale.count} objekt)` : "",
          areaContext ? `Wikipedia: ${areaContext.summary}` : "",
        ].filter(Boolean).join("\n");

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: `Du är en expert på bostadsmarknaden i Sverige. Skriv en professionell områdesanalys baserad på fakta. Skriv på svenska. Strukturera med rubriker: Sammanfattning, Demografi & Ekonomi, Infrastruktur & Tillgänglighet, Marknad & Priser, Trygghet, Slutsats. Var konkret och hjälpsam. Nämn inte att du är en AI.`,
          input: `Skriv en detaljerad områdesrapport för: ${address.trim()}\n\nFakta:\n${facts}`,
          max_output_tokens: 1200,
        });
        aiAnalysis = response.output_text?.trim() ?? "";
      } catch (err) {
        console.error("[area-report] AI analysis failed:", err);
      }
    }

    return NextResponse.json({
      address: address.trim(),
      city,
      lat,
      lng,
      demographics,
      nearby,
      areaContext,
      priceContext: {
        sale: priceContextSale,
      },
      aiAnalysis,
    });
  } catch (err) {
    console.error("[area-report] Error:", err);
    return NextResponse.json({ error: "Kunde inte generera områdesrapport" }, { status: 500 });
  }
}
