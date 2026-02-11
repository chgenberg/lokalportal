import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  VALID_TYPES,
  VALID_CATEGORIES,
  generateListingContent,
  type GenerateInput,
} from "@/lib/listingGenerate";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "landlord")
    return NextResponse.json({ error: "Endast hyresvärdar kan skapa annonser" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) return NextResponse.json({ error: "OpenAI är inte konfigurerad" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const { address, type, category, price, size, highlights = "", lat: bodyLat, lng: bodyLng } = body as Record<string, unknown>;
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
  if (!VALID_CATEGORIES.includes(category as "butik" | "kontor" | "lager" | "ovrigt")) {
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
    address: address.trim(),
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
    console.error("OpenAI generate error:", e);
    return NextResponse.json(
      { error: "AI-generering misslyckades. Försök igen." },
      { status: 502 }
    );
  }
}
