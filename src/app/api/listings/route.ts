import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

const VALID_TYPES = ["sale", "rent"] as const;
const VALID_CATEGORIES = ["butik", "kontor", "lager", "restaurang", "verkstad", "showroom", "popup", "atelje", "gym", "ovrigt"] as const;
type SortOption = "date" | "price_asc" | "price_desc" | "size";
const VALID_SORTS: SortOption[] = ["date", "price_asc", "price_desc", "size"];
const MAX_STRING_LENGTH = 100;

function trimMax(s: string | null | undefined): string | undefined {
  if (s == null) return undefined;
  const t = s.trim();
  return t === "" ? undefined : t.slice(0, MAX_STRING_LENGTH);
}

function parsePositiveInt(s: string | null): number | undefined {
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isNaN(n) || n < 0 ? undefined : n;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mine = searchParams.get("mine") === "true";
  let ownerId: string | undefined;
  if (mine) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
    }
    ownerId = session.user.id;
  }

  const rawType = searchParams.get("type");
  const rawCategory = searchParams.get("category");
  const rawSort = searchParams.get("sort");

  const type = rawType && VALID_TYPES.includes(rawType as (typeof VALID_TYPES)[number]) ? rawType : undefined;
  let category: string | undefined;
  if (rawCategory) {
    if (rawCategory.includes(",")) {
      const categories = rawCategory.split(",").map((c) => c.trim()).filter(Boolean);
      const validCategories = categories.filter((c) => VALID_CATEGORIES.includes(c as (typeof VALID_CATEGORIES)[number]));
      category = validCategories.length > 0 ? validCategories.join(",") : undefined;
    } else {
      category = VALID_CATEGORIES.includes(rawCategory as (typeof VALID_CATEGORIES)[number]) ? rawCategory : undefined;
    }
  }
  const sort: SortOption = rawSort && VALID_SORTS.includes(rawSort as SortOption) ? (rawSort as SortOption) : "date";

  const city = trimMax(searchParams.get("city"));
  const search = trimMax(searchParams.get("search"));
  const featured = searchParams.get("featured") === "true" ? true : undefined;
  const priceMin = parsePositiveInt(searchParams.get("priceMin"));
  const priceMax = parsePositiveInt(searchParams.get("priceMax"));
  const sizeMin = parsePositiveInt(searchParams.get("sizeMin"));
  const sizeMax = parsePositiveInt(searchParams.get("sizeMax"));
  const rawTags = searchParams.get("tags");
  const tags = rawTags ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;

  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const defaultLimit = 12;
  const pageRaw = pageParam ? parseInt(pageParam, 10) : 1;
  const limitRaw = limitParam ? parseInt(limitParam, 10) : defaultLimit;
  const page = Number.isNaN(pageRaw) ? 1 : Math.max(1, pageRaw);
  const limit = Number.isNaN(limitRaw) ? defaultLimit : Math.min(50, Math.max(1, limitRaw));

  try {
    const where: Prisma.ListingWhereInput = {};

    if (ownerId) where.ownerId = ownerId;
    if (city) where.city = { equals: city, mode: "insensitive" };
    if (type) where.type = type;
    if (category) {
      if (category.includes(",")) {
        const categories = category.split(",").map((c) => c.trim()).filter(Boolean);
        where.category = { in: categories };
      } else {
        where.category = category;
      }
    }
    if (featured) where.featured = true;
    if (priceMin != null || priceMax != null) {
      where.price = {};
      if (priceMin != null) where.price.gte = priceMin;
      if (priceMax != null) where.price.lte = priceMax;
    }
    if (sizeMin != null || sizeMax != null) {
      where.size = {};
      if (sizeMin != null) where.size.gte = sizeMin;
      if (sizeMax != null) where.size.lte = sizeMax;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (tags && tags.length > 0) {
      where.tags = { hasEvery: tags };
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      sort === "price_asc" ? { price: "asc" } :
      sort === "price_desc" ? { price: "desc" } :
      sort === "size" ? { size: "desc" } :
      { createdAt: "desc" };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.listing.count({ where }),
    ]);
    return NextResponse.json({ listings: listings.map(formatListing), total });
  } catch (err) {
    console.error("Listings error:", err);
    return NextResponse.json({ error: "Kunde inte hämta annonser" }, { status: 500 });
  }
}

function formatListing(l: {
  id: string; title: string; description: string; city: string; address: string;
  type: string; category: string; price: number; size: number; imageUrl: string;
  featured: boolean; createdAt: Date; lat: number; lng: number; tags: string[];
  ownerId: string | null; contactName: string; contactEmail: string; contactPhone: string;
}) {
  return {
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
    featured: l.featured,
    createdAt: l.createdAt.toISOString(),
    lat: l.lat,
    lng: l.lng,
    tags: l.tags,
    ownerId: l.ownerId,
    contact: {
      name: l.contactName,
      email: l.contactEmail,
      phone: l.contactPhone,
    },
  };
}
