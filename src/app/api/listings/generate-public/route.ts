import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  VALID_TYPES,
  VALID_CATEGORIES,
  generateListingContent,
  type GenerateInput,
} from "@/lib/listingGenerate";

export const maxDuration = 30;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) return NextResponse.json({ error: "OpenAI är inte konfigurerad" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Giltig e-post krävs. Ange din e-post från föregående steg." }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });
  if (!lead) {
    return NextResponse.json(
      { error: "Ange din e-post på föregående steg först för att använda verktyget." },
      { status: 403 }
    );
  }

  const { address, type, category, price, size, highlights = "", lat: bodyLat, lng: bodyLng } = body;
  if (!address || typeof address !== "string" || !address.trim()) {
    return NextResponse.json({ error: "Adress krävs" }, { status: 400 });
  }
  const hasBodyCoords =
    bodyLat != null &&
    bodyLng != null &&
    !Number.isNaN(Number(bodyLat)) &&
    !Number.isNaN(Number(bodyLng)) &&
    Number(bodyLat) >= -90 &&
    Number(bodyLat) <= 90 &&
    Number(bodyLng) >= -180 &&
    Number(bodyLng) <= 180;
  if (!VALID_TYPES.includes(type as "sale" | "rent")) {
    return NextResponse.json({ error: "Ogiltig typ. Använd sale eller rent." }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Ogiltig kategori." }, { status: 400 });
  }
  const priceNum = Number(price);
  const sizeNum = Number(size);
  if (Number.isNaN(priceNum) || priceNum < 0 || priceNum > 999_999_999) {
    return NextResponse.json({ error: "Ogiltigt pris." }, { status: 400 });
  }
  if (Number.isNaN(sizeNum) || sizeNum < 0 || sizeNum > 100_000) {
    return NextResponse.json({ error: "Ogiltig storlek (m²)." }, { status: 400 });
  }

  const input: GenerateInput = {
    address: (address as string).trim(),
    type: type as GenerateInput["type"],
    category: category as GenerateInput["category"],
    price: priceNum,
    size: sizeNum,
    highlights: typeof highlights === "string" ? highlights : "",
    lat: hasBodyCoords ? Number(bodyLat) : undefined,
    lng: hasBodyCoords ? Number(bodyLng) : undefined,
  };

  try {
    const result = await generateListingContent(input, apiKey);
    return NextResponse.json(result);
  } catch (e) {
    console.error("OpenAI generate-public error:", e);
    return NextResponse.json(
      { error: "AI-generering misslyckades. Försök igen." },
      { status: 502 }
    );
  }
}
