"use client";

import { useEffect, useState, useCallback, useRef, Suspense, lazy } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import FilterPanel from "@/components/FilterPanel";
import type { FilterState } from "@/components/FilterPanel";
import type { Listing } from "@/lib/types";
import { useDebounce } from "@/lib/useDebounce";
import CustomSelect from "@/components/CustomSelect";

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
    <div className="min-h-screen bg-muted/30">
      {/* Hero header */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-light opacity-90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/40 mb-3">Lediga lokaler</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Alla annonser</h1>
          <p className="text-white/50 text-[15px] max-w-lg">Utforska vårt kompletta utbud av kommersiella lokaler runt om i Sverige.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 -mt-8 relative z-10">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Sök lokaler efter namn, stad eller beskrivning..."
              value={filterState.searchInput}
              onChange={(e) => updateFilters({ searchInput: e.target.value })}
              className="w-full px-5 py-3.5 bg-white rounded-xl text-sm border border-border/60 shadow-lg shadow-navy/[0.04] focus:border-navy/30 focus:shadow-navy/[0.08] outline-none transition-all"
              aria-label="Sök lokaler"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium shadow-lg transition-all ${
                showFilters || hasFilters
                  ? "bg-navy text-white shadow-navy/20"
                  : "bg-white text-gray-600 hover:text-navy border border-border/60 shadow-navy/[0.04]"
              }`}
            >
              Filter
              {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-white/60" />}
            </button>
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium bg-white text-gray-600 hover:text-navy border border-border/60 shadow-lg shadow-navy/[0.04] transition-all"
              aria-label={viewMode === "grid" ? "Visa karta" : "Visa rutnät"}
            >
              {viewMode === "grid" ? "Karta" : "Rutnät"}
            </button>
          </div>
        </div>

        {showFilters && (
          <FilterPanel filters={filterState} onChange={updateFilters} onClear={clearFilters} totalResults={total} loading={loading} />
        )}

        {/* Results bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-400">
            {loading ? "Laddar..." : total > 0 ? `Visar ${(page - 1) * LIMIT + 1}\u2013${Math.min(page * LIMIT, total)} av ${total} lokaler` : "Inga lokaler hittades"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-400 whitespace-nowrap tracking-wide uppercase">Sortering:</span>
            <CustomSelect
              value={sort}
              onChange={(v) => { setSort(v as SortOption); setPage(1); }}
              options={[
                { value: "date", label: sortLabel.date },
                { value: "price_asc", label: sortLabel.price_asc },
                { value: "price_desc", label: sortLabel.price_desc },
                { value: "size", label: sortLabel.size },
              ]}
              className="w-48"
            />
          </div>
        </div>

        {/* Content */}
        {viewMode === "map" ? (
          <Suspense fallback={<div className="h-[600px] bg-white rounded-2xl border border-border/60 flex items-center justify-center"><div className="text-gray-400 text-sm">Laddar karta...</div></div>}>
            <div className="h-[600px] rounded-2xl overflow-hidden border border-border/60 shadow-sm"><ListingMap listings={listings} /></div>
          </Suspense>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border/40 overflow-hidden">
                <div className="h-52 bg-gradient-to-br from-muted to-muted/50 shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted/80 rounded-lg w-3/4" />
                  <div className="h-3 bg-muted/60 rounded-lg w-1/2" />
                  <div className="h-3 bg-muted/40 rounded-lg w-full" />
                  <div className="pt-3 border-t border-border/30 flex justify-between">
                    <div className="h-3 bg-muted/50 rounded w-16" />
                    <div className="h-4 bg-muted/70 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-border/40">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-navy/[0.04] flex items-center justify-center">
              <span className="text-xl font-bold text-navy/30">!</span>
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Något gick fel</h3>
            <p className="text-sm text-gray-400 mb-6">{error}</p>
            <button onClick={() => fetchListings()} className="btn-glow px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg">Försök igen</button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-border/40">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <span className="text-xl font-bold text-gray-300">0</span>
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">Inga lokaler hittades</h3>
            <p className="text-sm text-gray-400 mb-6">Prova att ändra dina sökfilter</p>
            <button onClick={clearFilters} className="btn-glow px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg">Rensa filter</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-600 hover:text-navy border border-border/60 disabled:opacity-40 disabled:pointer-events-none transition-all hover:shadow-sm"
                  aria-label="Föregående sida"
                >
                  &larr; Föregående
                </button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          pageNum === page
                            ? "bg-navy text-white shadow-sm"
                            : "bg-white text-gray-500 hover:text-navy border border-border/60 hover:shadow-sm"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-600 hover:text-navy border border-border/60 disabled:opacity-40 disabled:pointer-events-none transition-all hover:shadow-sm"
                  aria-label="Nästa sida"
                >
                  Nästa &rarr;
                </button>
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
    <Suspense fallback={<div className="min-h-screen bg-muted/30 flex items-center justify-center"><div className="text-gray-400 text-sm">Laddar...</div></div>}>
      <AnnonserContent />
    </Suspense>
  );
}
