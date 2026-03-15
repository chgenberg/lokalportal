import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/db";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { VALID_CATEGORIES } from "@/lib/listingGenerate";

export const maxDuration = 30;

const TAG_MAP: Record<string, string[]> = {
  "Skyltfönster": ["Skyltfönster"],
  "Parkering": ["Parkering"],
  "Nära kollektivtrafik": ["Nära kollektivtrafik"],
  "Hög takhöjd": ["Hög takhöjd"],
  "Lastbrygga": ["Lastbrygga"],
  "Öppen planlösning": ["Öppen planlösning"],
  "Mötesrum": ["Mötesrum"],
};

const CAT_LABELS: Record<string, string> = {
  villa: "Villa", lagenhet: "Lägenhet", fritidshus: "Fritidshus", tomt: "Tomt",
};

export async function POST(req: NextRequest) {
  const key = `advisor:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, 8);
  if (limited) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen om en stund." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "AI-tjänsten är inte konfigurerad" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const { email, business, budget, size, employees, city, requirements } = body;

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Giltig e-post krävs" }, { status: 400 });
  }
  if (!business || typeof business !== "string" || !business.trim()) {
    return NextResponse.json({ error: "Ange din bransch" }, { status: 400 });
  }

  const budgetNum = Number(budget) || 0;
  const sizeNum = Number(size) || 0;
  const employeesStr = typeof employees === "string" ? employees : "";
  const cityStr = typeof city === "string" ? city.trim() : "";
  const reqs = Array.isArray(requirements) ? requirements.filter((r): r is string => typeof r === "string") : [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { type: "sale" };
    if (cityStr) where.city = { contains: cityStr, mode: "insensitive" };
    if (budgetNum > 0) where.price = { lte: Math.ceil(budgetNum * 1.3) };
    if (sizeNum > 0) where.size = { gte: Math.floor(sizeNum * 0.5), lte: Math.ceil(sizeNum * 2) };
    if (reqs.length > 0) {
      const dbTags = reqs.flatMap((r) => TAG_MAP[r] || [r]);
      if (dbTags.length > 0) where.tags = { hasSome: dbTags };
    }

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const top10 = listings.slice(0, 10);
    const listingSummaries = top10.map((l, i) =>
      `${i + 1}. "${l.title}" – ${CAT_LABELS[l.category] || l.category}, ${l.size} m², ${l.price.toLocaleString("sv-SE")} kr, ${l.city}. Tags: ${l.tags.join(", ") || "inga"}`
    ).join("\n");

    const openai = new OpenAI({ apiKey, timeout: 20_000 });

    const systemPrompt = `Du är en expert på bostadsmarknaden i Sverige. Du hjälper köpare hitta rätt typ av bostad.
Svara ALLTID med giltig JSON (ingen markdown). Nycklar:
- "recommendation": sträng, 2-3 stycken med personlig rådgivning
- "suggestedCategory": en av ${VALID_CATEGORIES.join(", ")}
- "tips": array med 3-5 korta, praktiska tips
Skriv på svenska. Var konkret och hjälpsam.`;

    const userPrompt = [
      `Bransch: ${business.trim()}`,
      budgetNum > 0 ? `Budget: ${budgetNum.toLocaleString("sv-SE")} kr/mån` : "",
      sizeNum > 0 ? `Önskad storlek: ${sizeNum} m²` : "",
      employeesStr ? `Antal anställda: ${employeesStr}` : "",
      cityStr ? `Önskat område: ${cityStr}` : "",
      reqs.length > 0 ? `Krav: ${reqs.join(", ")}` : "",
      "",
      top10.length > 0 ? `Tillgängliga bostäder:\n${listingSummaries}` : "Inga matchande bostäder hittades just nu.",
      "",
      "Ge en personlig rekommendation: vilken typ av bostad passar bäst? Förklara varför. Om det finns matchande bostäder, nämn de bästa och förklara varför de passar.",
    ].filter(Boolean).join("\n");

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: systemPrompt,
      input: userPrompt,
      text: {
        format: {
          type: "json_schema",
          name: "advisor_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendation: { type: "string" },
              suggestedCategory: { type: "string" },
              tips: { type: "array", items: { type: "string" } },
            },
            required: ["recommendation", "suggestedCategory", "tips"],
            additionalProperties: false,
          },
        },
      },
      max_output_tokens: 800,
    });

    const raw = response.output_text?.trim();
    if (!raw) throw new Error("Tomt AI-svar");

    const parsed = JSON.parse(raw) as { recommendation: string; suggestedCategory: string; tips: string[] };

    const matchingListings = top10.slice(0, 5).map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      city: l.city,
      address: l.address,
      type: l.type,
      category: l.category,
      price: l.price,
      size: l.size,
      imageUrl: l.imageUrl,
      imageUrls: l.imageUrls ?? [],
      featured: l.featured,
      createdAt: l.createdAt.toISOString(),
      lat: l.lat,
      lng: l.lng,
      tags: l.tags,
      contact: { name: l.contactName, email: l.contactEmail, phone: l.contactPhone },
    }));

    return NextResponse.json({
      recommendation: parsed.recommendation || "",
      suggestedCategory: parsed.suggestedCategory || "lagenhet",
      matchingListings,
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : [],
    });
  } catch (err) {
    console.error("[advisor] Error:", err);
    return NextResponse.json({ error: "Kunde inte generera rekommendation" }, { status: 500 });
  }
}
