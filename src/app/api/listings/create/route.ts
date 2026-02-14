import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "landlord" && session.user.role !== "agent") return NextResponse.json({ error: "Endast hyresvärdar och mäklare kan skapa annonser" }, { status: 403 });

  const VALID_TYPES = ["sale", "rent"] as const;
  const VALID_CATEGORIES = ["butik", "kontor", "lager", "restaurang", "verkstad", "showroom", "popup", "atelje", "gym", "ovrigt"] as const;
  const MAX_TITLE = 200;
  const MAX_DESC = 5000;
  const MAX_CITY = 100;
  const MAX_ADDRESS = 300;
  const MAX_PRICE = 999_999_999;
  const MAX_SIZE = 100_000;

  try {
    const body = await request.json();
    const { title, description, city, address, type, category, price, size, tags, imageUrl, imageUrls, videoUrl, floorPlanImageUrl, nearby, priceContext, demographics, lat, lng } = body;

    if (!title || !description || !city || !address || !type || !category || price == null || price === "" || size == null || size === "") {
      return NextResponse.json({ error: "Alla obligatoriska fält måste fyllas i" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Ogiltig typ. Använd sale eller rent." }, { status: 400 });
    }
    // category can be comma-separated (multi-select)
    const categoryParts = String(category).split(",").map((c: string) => c.trim()).filter(Boolean);
    if (categoryParts.length === 0 || !categoryParts.every((c: string) => (VALID_CATEGORIES as readonly string[]).includes(c))) {
      return NextResponse.json({ error: "Ogiltig kategori." }, { status: 400 });
    }

    const priceNum = Number(price);
    const sizeNum = Number(size);
    if (Number.isNaN(priceNum) || priceNum < 0 || priceNum > MAX_PRICE) {
      return NextResponse.json({ error: "Ogiltigt pris." }, { status: 400 });
    }
    if (Number.isNaN(sizeNum) || sizeNum < 0 || sizeNum > MAX_SIZE) {
      return NextResponse.json({ error: "Ogiltig storlek (m²)." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });

    const urls = Array.isArray(imageUrls) ? imageUrls.slice(0, 10).filter((u): u is string => typeof u === "string").map((u) => u.trim().slice(0, 2000)).filter(Boolean) : [];
    const imageUrlStr = urls.length > 0 ? urls[0]! : (typeof imageUrl === "string" ? imageUrl.trim().slice(0, 2000) : "");
    const latNum = lat != null && lat !== "" ? Number(lat) : undefined;
    const lngNum = lng != null && lng !== "" ? Number(lng) : undefined;
    const hasValidCoords =
      typeof latNum === "number" &&
      !Number.isNaN(latNum) &&
      typeof lngNum === "number" &&
      !Number.isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180;

    const videoUrlStr = typeof videoUrl === "string" ? videoUrl.trim().slice(0, 2000) || null : null;
    const floorPlanStr = typeof floorPlanImageUrl === "string" ? floorPlanImageUrl.trim().slice(0, 2000) || null : null;
    const areaDataJson =
      nearby != null || priceContext != null || demographics != null
        ? { nearby: nearby ?? undefined, priceContext: priceContext ?? undefined, demographics: demographics ?? undefined }
        : undefined;

    const listing = await prisma.listing.create({
      data: {
        title: String(title).trim().slice(0, MAX_TITLE),
        description: String(description).trim().slice(0, MAX_DESC),
        city: String(city).trim().slice(0, MAX_CITY),
        address: String(address).trim().slice(0, MAX_ADDRESS),
        type,
        category,
        price: Math.floor(priceNum),
        size: Math.floor(sizeNum),
        imageUrl: imageUrlStr || "",
        imageUrls: urls,
        videoUrl: videoUrlStr,
        floorPlanImageUrl: floorPlanStr,
        ...(areaDataJson && { areaData: areaDataJson }),
        tags: Array.isArray(tags) ? tags.slice(0, 20).filter((t: unknown) => typeof t === "string").map((t: string) => t.trim().slice(0, 50)) : [],
        ownerId: session.user.id,
        contactName: user?.name || session.user.name || "",
        contactEmail: user?.email || session.user.email || "",
        contactPhone: user?.phone || "",
        ...(hasValidCoords && { lat: latNum, lng: lngNum }),
      },
    });

    return NextResponse.json({
      ...listing,
      createdAt: listing.createdAt.toISOString(),
      contact: { name: listing.contactName, email: listing.contactEmail, phone: listing.contactPhone },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Kunde inte skapa annons" }, { status: 500 });
  }
}
