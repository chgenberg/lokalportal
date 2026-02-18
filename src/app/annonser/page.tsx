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

const LIMIT = 12;
type SortOption = "date" | "price_asc" | "price_desc" | "size";

function AnnonserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  const typeParam = searchParams.get("type");
  const priceMinParam = searchParams.get("priceMin");
  const priceMaxParam = searchParams.get("priceMax");
  const [filterState, setFilterState] = useState<FilterState>({
    city: searchParams.get("city") || "",
    type: typeParam || "",
    category: searchParams.get("category") || "",
    searchInput: searchParams.get("search") || "",
    priceRange:
      typeParam !== "sale"
        ? [
            parseInt(priceMinParam || "0", 10) || 0,
            parseInt(priceMaxParam || "100000", 10) || 100000,
          ]
        : [0, 100000],
    salePriceRange:
      typeParam === "sale"
        ? [
            parseFloat(priceMinParam || "0") / 1e6,
            priceMaxParam ? Math.min(20, parseFloat(priceMaxParam) / 1e6) : 20,
          ]
        : [0, 20],
    sizeRange: [
      parseInt(searchParams.get("sizeMin") || "0", 10) || 0,
      parseInt(searchParams.get("sizeMax") || "1000", 10) || 1000,
    ],
    selectedTags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
    nearTo: searchParams.get("nearTo")?.split(",").filter(Boolean) || [],
  });

  const debouncedSearch = useDebounce(filterState.searchInput, 300);
  const debouncedCity = useDebounce(filterState.city, 300);
  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get("page") || "1", 10)));
  const [sort, setSort] = useState<SortOption>(() => (searchParams.get("sort") as SortOption) || "date");
  const [total, setTotal] = useState(0);
  const filterChangeCount = useRef(0);

  useEffect(() => {
    if (showFilters || mobileMapOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [showFilters, mobileMapOpen]);

  const updateFilters = useCallback((partial: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({
      city: "",
      type: "",
      category: "",
      searchInput: "",
      priceRange: [0, 100000],
      salePriceRange: [0, 20],
      sizeRange: [0, 1000],
      selectedTags: [],
      nearTo: [],
    });
    setPage(1);
    setSort("date");
    router.push("/annonser");
  }, [router]);

  useEffect(() => {
    filterChangeCount.current += 1;
    if (filterChangeCount.current > 1) setPage(1);
  }, [debouncedCity, filterState.type, filterState.category, debouncedSearch, filterState.priceRange, filterState.salePriceRange, filterState.sizeRange, filterState.selectedTags, filterState.nearTo]);

  const priceMin = filterState.type === "sale" ? filterState.salePriceRange[0] * 1e6 : filterState.priceRange[0];
  const priceMax = filterState.type === "sale" ? filterState.salePriceRange[1] * 1e6 : filterState.priceRange[1];

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedCity) params.set("city", debouncedCity);
    if (filterState.type) params.set("type", filterState.type);
    if (filterState.category) params.set("category", filterState.category);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort !== "date") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (priceMin > 0) params.set("priceMin", String(Math.round(priceMin)));
    if (priceMax < (filterState.type === "sale" ? 20e6 : 100000)) params.set("priceMax", String(Math.round(priceMax)));
    if (filterState.sizeRange[0] > 0) params.set("sizeMin", String(filterState.sizeRange[0]));
    if (filterState.sizeRange[1] < 1000) params.set("sizeMax", String(filterState.sizeRange[1]));
    if (filterState.selectedTags.length > 0) params.set("tags", filterState.selectedTags.join(","));
    if (filterState.nearTo.length > 0) params.set("nearTo", filterState.nearTo.join(","));
    const q = params.toString();
    router.replace(q ? `/annonser?${q}` : "/annonser", { scroll: false });
  }, [debouncedCity, filterState.type, filterState.category, debouncedSearch, sort, page, priceMin, priceMax, filterState.sizeRange, filterState.selectedTags, filterState.nearTo, router]);

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
    if (priceMin > 0) params.set("priceMin", String(Math.round(priceMin)));
    if (priceMax < (filterState.type === "sale" ? 20e6 : 100000)) params.set("priceMax", String(Math.round(priceMax)));
    if (filterState.sizeRange[0] > 0) params.set("sizeMin", String(filterState.sizeRange[0]));
    if (filterState.sizeRange[1] < 1000) params.set("sizeMax", String(filterState.sizeRange[1]));
    if (filterState.selectedTags.length > 0) params.set("tags", filterState.selectedTags.join(","));

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) { setError("Kunde inte ladda annonser."); setListings([]); setTotal(0); return; }
      const data = await res.json();
      if (data.listings && typeof data.total === "number") { setListings(data.listings); setTotal(data.total); }
      else { setListings(Array.isArray(data) ? data : []); setTotal(Array.isArray(data) ? data.length : 0); }
    } catch { setError("Ett fel uppstod."); setListings([]); setTotal(0); } finally { setLoading(false); }
  }, [debouncedCity, filterState.type, filterState.category, debouncedSearch, sort, page, priceMin, priceMax, filterState.sizeRange, filterState.selectedTags]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const goToPage = (p: number) => { setPage(Math.max(1, Math.min(p, Math.ceil(total / LIMIT)))); };

  const hasFilters =
    filterState.city ||
    filterState.type ||
    filterState.category ||
    filterState.searchInput ||
    filterState.priceRange[0] > 0 ||
    filterState.priceRange[1] < 100000 ||
    filterState.salePriceRange[0] > 0 ||
    filterState.salePriceRange[1] < 20 ||
    filterState.sizeRange[0] > 0 ||
    filterState.sizeRange[1] < 1000 ||
    filterState.selectedTags.length > 0 ||
    filterState.nearTo.length > 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const sortLabel: Record<SortOption, string> = { date: "Nyast", price_asc: "Pris (lågt–högt)", price_desc: "Pris (högt–lågt)", size: "Storlek" };

  return (
    <div className="min-h-screen bg-white">
      {/* Heading + search */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-4 sm:pb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-navy tracking-tight mb-4 sm:mb-6">
          Hitta lokal att hyra
        </h1>

        {/* Search bar + Filter button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Skriv en stad eller område"
              value={filterState.searchInput}
              onChange={(e) => updateFilters({ searchInput: e.target.value })}
              className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3 bg-white rounded-full text-sm border border-gray-200 focus:border-navy/30 focus:ring-2 focus:ring-navy/5 outline-none transition-all"
              aria-label="Sök lokaler"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-3 rounded-full text-sm font-medium border transition-all shrink-0 ${
              showFilters || hasFilters
                ? "bg-navy text-white border-navy"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M3 4h18M6 8h12M9 12h6" />
            </svg>
            <span className="hidden sm:inline">Filter</span>
            {hasFilters && !showFilters && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
          </button>
        </div>
      </div>

      {/* Filter panel — desktop inline, mobile bottom sheet */}
      {showFilters && (
        <>
          {/* Desktop: inline panel */}
          <div className="hidden sm:block max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <FilterPanel
              filters={filterState}
              onChange={updateFilters}
              onClear={clearFilters}
              onClose={() => setShowFilters(false)}
              totalResults={total}
              loading={loading}
              compact
            />
          </div>

          {/* Mobile: bottom sheet overlay */}
          <div className="sm:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-white rounded-t-3xl animate-slide-up">
              <div className="sticky top-0 bg-white z-10 px-5 pt-3 pb-2 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
              </div>
              <div className="px-4 py-4">
                <FilterPanel
                  filters={filterState}
                  onChange={updateFilters}
                  onClear={clearFilters}
                  onClose={() => setShowFilters(false)}
                  totalResults={total}
                  loading={loading}
                  compact
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Results bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-4">
          <p className="text-xs sm:text-sm text-gray-500">
            {loading ? "Laddar..." : total > 0 ? (
              <><span className="font-semibold text-navy">{total.toLocaleString("sv-SE")}</span> lokaler</>
            ) : "Inga lokaler hittades"}
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowMap(!showMap)}
              className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              {showMap ? "Dölj karta" : "Visa karta"}
            </button>
            <CustomSelect
              value={sort}
              onChange={(v) => { setSort(v as SortOption); setPage(1); }}
              options={[
                { value: "date", label: sortLabel.date },
                { value: "price_asc", label: sortLabel.price_asc },
                { value: "price_desc", label: sortLabel.price_desc },
                { value: "size", label: sortLabel.size },
              ]}
              className="w-32 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Main content: listings + map */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-24 lg:pb-12">
        <div className="flex gap-6">
          {/* Listings */}
          <div className={`flex-1 min-w-0 ${showMap ? "lg:w-1/2" : ""}`}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 shimmer" />
                    <div className="p-3 sm:p-4 space-y-2.5">
                      <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                      <div className="h-3 bg-gray-50 rounded-lg w-1/2" />
                      <div className="h-3 bg-gray-50 rounded-lg w-full" />
                      <div className="pt-2 flex justify-between">
                        <div className="h-3 bg-gray-100 rounded w-16" />
                        <div className="h-4 bg-gray-100 rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div role="alert" className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-5 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-bold text-gray-300">!</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-navy mb-2">Något gick fel</h3>
                <p className="text-sm text-gray-400 mb-5 sm:mb-6 px-4">{error}</p>
                <button onClick={() => fetchListings()} className="px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-full transition-all hover:shadow-md">Försök igen</button>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-5 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <span className="text-base sm:text-lg font-bold text-gray-300">0</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-navy mb-2">Inga lokaler hittades</h3>
                <p className="text-sm text-gray-400 mb-5 sm:mb-6">Prova att ändra dina sökfilter</p>
                <button onClick={clearFilters} className="px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-full transition-all hover:shadow-md">Rensa filter</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 sm:mt-10 flex items-center justify-center gap-0.5 sm:gap-1">
                    <button
                      type="button"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      className="w-10 h-10 sm:px-4 sm:py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-navy hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center"
                      aria-label="Föregående sida"
                    >
                      &larr;
                    </button>
                    <div className="flex items-center gap-0.5 sm:gap-1 mx-1">
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
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-sm font-medium transition-all ${
                              pageNum === page
                                ? "bg-navy text-white"
                                : "text-gray-500 hover:text-navy hover:bg-gray-50"
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
                      className="w-10 h-10 sm:px-4 sm:py-2.5 rounded-full text-sm font-medium text-gray-500 hover:text-navy hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center"
                      aria-label="Nästa sida"
                    >
                      &rarr;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Map (desktop, right side) */}
          {showMap && (
            <div className="hidden lg:block lg:w-1/2 flex-shrink-0">
              <div className="sticky top-20 h-[calc(100vh-6rem)] rounded-2xl overflow-hidden border border-gray-100">
                <Suspense fallback={<div className="h-full bg-gray-50 flex items-center justify-center"><span className="text-gray-400 text-sm">Laddar karta...</span></div>}>
                  <ListingMap listings={listings} />
                </Suspense>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating buttons */}
      <div className="lg:hidden fixed bottom-5 left-0 right-0 z-40 flex justify-center gap-3 px-4">
        <button
          onClick={() => setMobileMapOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-navy text-white text-sm font-medium rounded-full shadow-lg shadow-navy/20 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
          </svg>
          Karta
        </button>
      </div>

      {/* Mobile map fullscreen overlay */}
      {mobileMapOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
            <button
              onClick={() => setMobileMapOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-navy text-sm font-medium rounded-full shadow-lg border border-gray-100 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
              </svg>
              Lista
            </button>
            <span className="px-3 py-1.5 bg-white text-xs font-medium text-gray-500 rounded-full shadow-lg border border-gray-100">
              {total} lokaler
            </span>
          </div>
          <div className="h-full">
            <Suspense fallback={<div className="h-full bg-gray-50 flex items-center justify-center"><span className="text-gray-400 text-sm">Laddar karta...</span></div>}>
              <ListingMap listings={listings} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnnonserPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-400 text-sm">Laddar...</div></div>}>
      <AnnonserContent />
    </Suspense>
  );
}
