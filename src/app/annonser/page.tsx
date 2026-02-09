"use client";

import { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import FilterPanel from "@/components/FilterPanel";
import type { FilterState } from "@/components/FilterPanel";
import type { Listing } from "@/lib/types";
import { useDebounce } from "@/lib/useDebounce";

const ListingMap = lazy(() => import("@/components/ListingMap"));

const LIMIT = 9;
type SortOption = "date" | "price_asc" | "price_desc" | "size";

function AnnonserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const [filterState, setFilterState] = useState<FilterState>({
    city: searchParams.get("city") || "",
    type: searchParams.get("type") || "",
    category: searchParams.get("category") || "",
    searchInput: searchParams.get("search") || "",
    priceRange: [
      parseInt(searchParams.get("priceMin") || "0", 10) || 0,
      parseInt(searchParams.get("priceMax") || "200000", 10) || 200000,
    ],
    sizeRange: [
      parseInt(searchParams.get("sizeMin") || "0", 10) || 0,
      parseInt(searchParams.get("sizeMax") || "2000", 10) || 2000,
    ],
    selectedTags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
  });

  const debouncedSearch = useDebounce(filterState.searchInput, 300);
  const debouncedCity = useDebounce(filterState.city, 300);
  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get("page") || "1", 10)));
  const [sort, setSort] = useState<SortOption>(() => (searchParams.get("sort") as SortOption) || "date");
  const [total, setTotal] = useState(0);
  const filterChangeCount = useRef(0);

  const updateFilters = useCallback((partial: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({ city: "", type: "", category: "", searchInput: "", priceRange: [0, 200000], sizeRange: [0, 2000], selectedTags: [] });
    setPage(1);
    setSort("date");
    router.push("/annonser");
  }, [router]);

  useEffect(() => {
    filterChangeCount.current += 1;
    if (filterChangeCount.current > 1) setPage(1);
  }, [debouncedCity, filterState.type, filterState.category, debouncedSearch, filterState.priceRange, filterState.sizeRange, filterState.selectedTags]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedCity) params.set("city", debouncedCity);
    if (filterState.type) params.set("type", filterState.type);
    if (filterState.category) params.set("category", filterState.category);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort !== "date") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (filterState.priceRange[0] > 0) params.set("priceMin", String(filterState.priceRange[0]));
    if (filterState.priceRange[1] < 200000) params.set("priceMax", String(filterState.priceRange[1]));
    if (filterState.sizeRange[0] > 0) params.set("sizeMin", String(filterState.sizeRange[0]));
    if (filterState.sizeRange[1] < 2000) params.set("sizeMax", String(filterState.sizeRange[1]));
    if (filterState.selectedTags.length > 0) params.set("tags", filterState.selectedTags.join(","));
    const q = params.toString();
    router.replace(q ? `/annonser?${q}` : "/annonser", { scroll: false });
  }, [debouncedCity, filterState.type, filterState.category, debouncedSearch, sort, page, filterState.priceRange, filterState.sizeRange, filterState.selectedTags, router]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedCity) params.set("city", debouncedCity);
    if (filterState.type) params.set("type", filterState.type);
    if (filterState.category) params.set("category", filterState.category);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    if (filterState.priceRange[0] > 0) params.set("priceMin", String(filterState.priceRange[0]));
    if (filterState.priceRange[1] < 200000) params.set("priceMax", String(filterState.priceRange[1]));
    if (filterState.sizeRange[0] > 0) params.set("sizeMin", String(filterState.sizeRange[0]));
    if (filterState.sizeRange[1] < 2000) params.set("sizeMax", String(filterState.sizeRange[1]));
    if (filterState.selectedTags.length > 0) params.set("tags", filterState.selectedTags.join(","));

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) { setError("Kunde inte ladda annonser."); setListings([]); setTotal(0); return; }
      const data = await res.json();
      if (data.listings && typeof data.total === "number") { setListings(data.listings); setTotal(data.total); }
      else { setListings(Array.isArray(data) ? data : []); setTotal(Array.isArray(data) ? data.length : 0); }
    } catch { setError("Ett fel uppstod."); setListings([]); setTotal(0); } finally { setLoading(false); }
  }, [debouncedCity, filterState.type, filterState.category, debouncedSearch, sort, page, filterState.priceRange, filterState.sizeRange, filterState.selectedTags]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const goToPage = (p: number) => { setPage(Math.max(1, Math.min(p, Math.ceil(total / LIMIT)))); };

  const hasFilters = filterState.city || filterState.type || filterState.category || filterState.searchInput || filterState.priceRange[0] > 0 || filterState.priceRange[1] < 200000 || filterState.sizeRange[0] > 0 || filterState.sizeRange[1] < 2000 || filterState.selectedTags.length > 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const sortLabel: Record<SortOption, string> = { date: "Senaste", price_asc: "Pris (lågt till högt)", price_desc: "Pris (högt till lågt)", size: "Storlek" };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-navy mb-2">Alla annonser</h1>
          <p className="text-gray-500">Utforska vårt kompletta utbud av kommersiella lokaler</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Sök lokaler..."
              value={filterState.searchInput}
              onChange={(e) => updateFilters({ searchInput: e.target.value })}
              className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none transition-colors"
              aria-label="Sök lokaler"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
                showFilters || hasFilters ? "bg-navy text-white" : "bg-muted text-gray-600 hover:bg-muted-dark border border-border"
              }`}
            >
              Filter
              {hasFilters && <span className="w-2 h-2 rounded-full bg-white/60" />}
            </button>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-muted text-gray-600 hover:bg-muted-dark border border-border transition-colors"
              aria-label={viewMode === "grid" ? "Visa karta" : "Visa rutnät"}
            >
              {viewMode === "grid" ? "Karta" : "Rutnät"}
            </button>
          </div>
        </div>

        {showFilters && (
          <FilterPanel filters={filterState} onChange={updateFilters} onClear={clearFilters} totalResults={total} loading={loading} />
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-500">
            {loading ? "Laddar..." : total > 0 ? `Visar ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} av ${total} lokaler` : "Inga lokaler hittades"}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-annonser" className="text-sm text-gray-500 whitespace-nowrap">Sortering:</label>
            <select
              id="sort-annonser"
              value={sort}
              onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
              className="px-3 py-2 bg-muted rounded-lg text-sm border border-border focus:border-navy outline-none"
              aria-label="Sortera annonser"
            >
              <option value="date">{sortLabel.date}</option>
              <option value="price_asc">{sortLabel.price_asc}</option>
              <option value="price_desc">{sortLabel.price_desc}</option>
              <option value="size">{sortLabel.size}</option>
            </select>
          </div>
        </div>

        {viewMode === "map" ? (
          <Suspense fallback={<div className="h-[600px] bg-muted rounded-2xl flex items-center justify-center"><div className="text-gray-400">Laddar karta...</div></div>}>
            <div className="h-[600px] rounded-2xl overflow-hidden border border-border"><ListingMap listings={listings} /></div>
          </Suspense>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="h-52 bg-muted animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-navy/5 flex items-center justify-center">
              <span className="text-2xl font-bold text-navy">!</span>
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Något gick fel</h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button onClick={() => fetchListings()} className="px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">Försök igen</button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-300">0</span>
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Inga lokaler hittades</h3>
            <p className="text-sm text-gray-500 mb-6">Prova att ändra dina sökfilter</p>
            <button onClick={clearFilters} className="px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">Rensa filter</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1} className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-white text-gray-700 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors" aria-label="Föregående sida">&larr; Föregående</button>
                <span className="px-4 py-2 text-sm text-gray-500">Sida {page} av {totalPages}</span>
                <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="px-4 py-2 rounded-lg text-sm font-medium border border-border bg-white text-gray-700 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors" aria-label="Nästa sida">Nästa &rarr;</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AnnonserPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-400">Laddar...</div></div>}>
      <AnnonserContent />
    </Suspense>
  );
}
