import { NextRequest, NextResponse } from "next/server";
import { getFilteredListings } from "@/lib/redis";
import type { ListingSort } from "@/lib/redis";

const VALID_TYPES = ["sale", "rent"] as const;
const VALID_CATEGORIES = ["butik", "kontor", "lager", "ovrigt"] as const;
const VALID_SORTS: ListingSort[] = ["date", "price_asc", "price_desc", "size"];
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

  const rawType = searchParams.get("type");
  const rawCategory = searchParams.get("category");
  const rawSort = searchParams.get("sort");

  const type = rawType && VALID_TYPES.includes(rawType as (typeof VALID_TYPES)[number]) ? rawType : undefined;
  const category = rawCategory && VALID_CATEGORIES.includes(rawCategory as (typeof VALID_CATEGORIES)[number]) ? rawCategory : undefined;
  const sort = rawSort && VALID_SORTS.includes(rawSort as ListingSort) ? (rawSort as ListingSort) : undefined;

  const rawTags = searchParams.get("tags");
  const tags = rawTags ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;

  const filters = {
    city: trimMax(searchParams.get("city")),
    type,
    category,
    search: trimMax(searchParams.get("search")),
    featured: searchParams.get("featured") === "true" ? true : undefined,
    sort,
    priceMin: parsePositiveInt(searchParams.get("priceMin")),
    priceMax: parsePositiveInt(searchParams.get("priceMax")),
    sizeMin: parsePositiveInt(searchParams.get("sizeMin")),
    sizeMax: parsePositiveInt(searchParams.get("sizeMax")),
    tags: tags && tags.length > 0 ? tags : undefined,
  };

  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const pageRaw = pageParam ? parseInt(pageParam, 10) : 0;
  const limitRaw = limitParam ? parseInt(limitParam, 10) : 0;
  const page = Number.isNaN(pageRaw) ? 0 : Math.max(1, pageRaw);
  const limit = Number.isNaN(limitRaw) ? 0 : Math.min(50, Math.max(1, limitRaw));

  try {
    const all = await getFilteredListings(filters);

    if (page > 0 && limit > 0) {
      const start = (page - 1) * limit;
      const listings = all.slice(start, start + limit);
      return NextResponse.json({ listings, total: all.length });
    }

    return NextResponse.json(all);
  } catch {
    return NextResponse.json(
      { error: "Kunde inte hämta annonser" },
      { status: 500 }
    );
  }
}
