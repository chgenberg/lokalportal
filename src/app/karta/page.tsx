"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import type { Listing } from "@/lib/types";
import { List, MapPin } from "lucide-react";
import Link from "next/link";

const ListingMap = lazy(() => import("@/components/ListingMap"));

export default function KartaPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch("/api/listings");
        if (res.ok) {
          const data = await res.json();
          setListings(Array.isArray(data) ? data : data.listings || []);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy mb-1">Karta</h1>
              <p className="text-sm text-gray-500">
                Utforska alla lediga lokaler på kartan
              </p>
            </div>
            <Link
              href="/annonser"
              className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors"
            >
              <List className="w-4 h-4" />
              Listvy
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ height: "calc(100vh - 180px)" }}>
        {/* Sidebar with listings */}
        <div className="lg:w-80 xl:w-96 overflow-y-auto border-r border-border bg-white">
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-3">
              {listings.length} lokaler
            </p>
            <div className="space-y-2">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted animate-pulse h-20" />
                  ))
                : listings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => setSelectedId(listing.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedId === listing.id
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-navy truncate">
                            {listing.title}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {listing.city}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-navy whitespace-nowrap">
                          {listing.type === "sale"
                            ? `${(listing.price / 1000000).toFixed(1)} mkr`
                            : `${(listing.price / 1000).toFixed(0)}k`}
                        </span>
                      </div>
                    </button>
                  ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-gray-400">Laddar karta...</div>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-gray-400">Laddar karta...</div>
                </div>
              }
            >
              <ListingMap
                listings={listings}
                selectedId={selectedId}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
