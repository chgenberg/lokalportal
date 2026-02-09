"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import type { Listing } from "@/lib/types";
import { Search, SlidersHorizontal, X, MapPin, ChevronDown } from "lucide-react";

function AnnonserContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    if (searchQuery) params.set("search", searchQuery);

    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [city, type, category, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const clearFilters = () => {
    setCity("");
    setType("");
    setCategory("");
    setSearchQuery("");
    router.push("/annonser");
  };

  const hasFilters = city || type || category || searchQuery;

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-navy mb-2">Alla annonser</h1>
          <p className="text-gray-500">
            Utforska vårt kompletta utbud av kommersiella lokaler
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Sök lokaler..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors ${
              showFilters || hasFilters
                ? "bg-navy text-white"
                : "bg-muted text-gray-600 hover:bg-muted-dark border border-border"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {hasFilters && (
              <span className="w-2 h-2 rounded-full bg-accent" />
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mb-8 p-6 bg-muted rounded-2xl border border-border animate-slide-down">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* City filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Stad
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Alla städer"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg text-sm border border-border focus:border-accent outline-none"
                  />
                </div>
              </div>

              {/* Type filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Typ
                </label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 bg-white rounded-lg text-sm border border-border focus:border-accent outline-none pr-10"
                  >
                    <option value="">Alla typer</option>
                    <option value="sale">Till salu</option>
                    <option value="rent">Uthyres</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Category filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Kategori
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 bg-white rounded-lg text-sm border border-border focus:border-accent outline-none pr-10"
                  >
                    <option value="">Alla kategorier</option>
                    <option value="butik">Butik</option>
                    <option value="kontor">Kontor</option>
                    <option value="lager">Lager</option>
                    <option value="ovrigt">Övrigt</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
              >
                <X className="w-4 h-4" />
                Rensa filter
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? "Laddar..." : `${listings.length} lokaler hittades`}
          </p>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border overflow-hidden"
              >
                <div className="h-52 bg-muted animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">
              Inga lokaler hittades
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Prova att ändra dina sökfilter
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors"
            >
              Rensa filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnnonserPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-400">Laddar...</div>
        </div>
      }
    >
      <AnnonserContent />
    </Suspense>
  );
}
