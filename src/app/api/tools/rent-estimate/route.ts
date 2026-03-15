import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/db";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import {
  geocodeAddress,
  fetchAreaData,
  fetchAreaPriceContext,
  VALID_CATEGORIES,
} from "@/lib/listingGenerate";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const key = `rent-estimate:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, 10);
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

  const { email, address, category, size } = body;

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Giltig e-post krävs" }, { status: 400 });
  }
  if (!address || typeof address !== "string" || !address.trim()) {
    return NextResponse.json({ error: "Adress krävs" }, { status: 400 });
  }
  if (!category || typeof category !== "string" || !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Ogiltig kategori" }, { status: 400 });
  }
  const sizeNum = Number(size);
  if (!sizeNum || sizeNum < 1 || sizeNum > 100_000) {
    return NextResponse.json({ error: "Ogiltig storlek" }, { status: 400 });
  }

  try {
    const geocode = await geocodeAddress(address.trim());
    const city = geocode?.city ?? address.split(",")[0]?.trim() ?? "Okänd ort";
    const lat = geocode?.lat ?? 0;
    const lng = geocode?.lng ?? 0;

    const sizeMin = Math.floor(sizeNum * 0.5);
    const sizeMax = Math.ceil(sizeNum * 1.5);

    const comparables = await prisma.listing.findMany({
      where: {
        type: "sale",
        category: { contains: category },
        city: { equals: city, mode: "insensitive" },
        size: { gte: sizeMin, lte: sizeMax },
      },
      select: { price: true, size: true },
      take: 200,
    });

    let estimatedPerSqm = 0;
    let medianPrice = 0;
    let minPrice = 0;
    let maxPrice = 0;

    if (comparables.length > 0) {
      const perSqm = comparables
        .filter((c) => c.size > 0)
        .map((c) => c.price / c.size)
        .sort((a, b) => a - b);

      if (perSqm.length > 0) {
        const mid = Math.floor(perSqm.length / 2);
        estimatedPerSqm = perSqm.length % 2 === 0
          ? Math.round((perSqm[mid - 1]! + perSqm[mid]!) / 2)
          : Math.round(perSqm[mid]!);
        minPrice = Math.round(perSqm[0]!);
        maxPrice = Math.round(perSqm[perSqm.length - 1]!);
      }

      const prices = comparables.map((c) => c.price).sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      medianPrice = prices.length % 2 === 0
        ? Math.round((prices[mid - 1]! + prices[mid]!) / 2)
        : prices[mid]!;
    }

    const estimatedRent = estimatedPerSqm > 0 ? Math.round(estimatedPerSqm * sizeNum) : 0;

    const [areaData, priceContext] = await Promise.all([
      lat && lng ? fetchAreaData(city, lat, lng, address.trim()) : Promise.resolve(null),
      fetchAreaPriceContext(city, category, "sale"),
    ]);

    let aiSummary = "";
    if (apiKey?.trim()) {
      try {
        const openai = new OpenAI({ apiKey, timeout: 15_000 });
        const catLabels: Record<string, string> = {
          villa: "villa", lägenhet: "lägenhet", fritidshus: "fritidshus", tomt: "tomt",
          radhus: "radhus", ovrigt: "bostad",
        };
        const catLabel = catLabels[category] ?? category;

        const prompt = [
          `Ge en kort sammanfattning (3-4 meningar) av försäljningsläget för en ${catLabel} på ${sizeNum} m² i ${city}.`,
          estimatedPerSqm > 0 ? `Uppskattat pris: ${estimatedRent.toLocaleString("sv-SE")} kr (${estimatedPerSqm} kr/m²).` : "Inga jämförbara objekt hittades.",
          comparables.length > 0 ? `Baserat på ${comparables.length} liknande bostäder.` : "",
          priceContext ? `Marknadens medianpris: ${priceContext.medianPrice.toLocaleString("sv-SE")} kr.` : "",
          areaData?.demographics ? `Befolkning: ${areaData.demographics.population.toLocaleString("sv-SE")}. Medianinkomst: ${areaData.demographics.medianIncome ?? "okänd"} tkr/år.` : "",
          "Skriv på svenska. Var konkret och hjälpsam. Nämn inte att du är en AI.",
        ].filter(Boolean).join(" ");

        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          instructions: "Du är en expert på bostadsmarknaden i Sverige. Ge korta, konkreta sammanfattningar.",
          input: prompt,
          max_output_tokens: 300,
        });
        aiSummary = response.output_text?.trim() ?? "";
      } catch (err) {
        console.error("[rent-estimate] AI summary failed:", err);
      }
    }

    return NextResponse.json({
      estimatedRent,
      estimatedPerSqm,
      comparables: {
        count: comparables.length,
        median: medianPrice,
        min: minPrice > 0 ? Math.round(minPrice * sizeNum) : 0,
        max: maxPrice > 0 ? Math.round(maxPrice * sizeNum) : 0,
      },
      demographics: areaData?.demographics ?? null,
      nearby: areaData?.nearby ?? null,
      areaContext: areaData?.areaContext ?? null,
      priceContext: priceContext ?? null,
      aiSummary,
      city,
    });
  } catch (err) {
    console.error("[rent-estimate] Error:", err);
    return NextResponse.json({ error: "Kunde inte beräkna prisuppskattning" }, { status: 500 });
  }
}
