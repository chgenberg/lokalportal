"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import type { Listing } from "@/lib/types";
import Link from "next/link";

const ListingMap = lazy(() => import("@/components/ListingMap"));

export default function KartaPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const fetchListings = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      if (res.ok) {
        const data = await res.json();
        setListings(Array.isArray(data) ? data : data.listings || []);
      } else {
        setError("Kunde inte ladda lokaler. Försök igen.");
      }
    } catch {
      setError("Ett fel uppstod vid hämtning. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy mb-1">Karta</h1>
              <p className="text-sm text-gray-500">Utforska alla lediga lokaler på kartan</p>
            </div>
            <Link href="/annonser" className="px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">
              Listvy
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-0 h-[calc(100dvh-180px)]">
        <div className="lg:w-80 xl:w-96 overflow-y-auto border-r border-border bg-white shrink-0 max-h-[40vh] lg:max-h-none">
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-3">{listings.length} lokaler</p>
            {error && (
              <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-800">
                <p className="mb-2">{error}</p>
                <button type="button" onClick={fetchListings} className="text-sm font-medium text-red-600 hover:underline">
                  Försök igen
                </button>
              </div>
            )}
            <div className="space-y-2">
              {loading
                ? [...Array(5)].map((_, i) => <div key={i} className="p-3 rounded-xl bg-muted animate-pulse h-20" />)
                : !error && listings.length === 0
                ? (
                    <div className="p-6 rounded-xl bg-muted/50 border border-border/40 text-center">
                      <p className="text-sm text-gray-500 mb-2">Inga lokaler hittades</p>
                      <p className="text-xs text-gray-400 mb-4">Använd sökning och filter för att hitta lokaler.</p>
                      <Link href="/annonser" className="inline-block px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors">
                        Sök lokaler
                      </Link>
                    </div>
                  )
                : listings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => setSelectedId(listing.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                        selectedId === listing.id ? "border-navy bg-navy/5" : "border-border hover:border-navy/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-navy truncate">{listing.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{listing.city}</p>
                        </div>
                        <span className="text-sm font-bold text-navy whitespace-nowrap">
                          {listing.type === "sale" ? `${(listing.price / 1000000).toFixed(1)} mkr` : `${(listing.price / 1000).toFixed(0)}k`}
                        </span>
                      </div>
                    </button>
                  ))}
            </div>
          </div>
        </div>

        <div className="flex-1 relative min-h-[55vh] lg:min-h-0">
          {loading ? (
            <div className="w-full h-full bg-muted flex items-center justify-center"><div className="text-gray-400">Laddar karta...</div></div>
          ) : (
            <Suspense fallback={<div className="w-full h-full bg-muted flex items-center justify-center"><div className="text-gray-400">Laddar karta...</div></div>}>
              <ListingMap listings={listings} selectedId={selectedId} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
