"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ListingCard from "./ListingCard";
import type { Listing } from "@/lib/types";

export default function FeaturedListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch("/api/listings?featured=true");
        if (!res.ok) { setError("Kunde inte ladda utvalda lokaler."); setListings([]); return; }
        const data = await res.json();
        setListings(data.slice(0, 4));
      } catch { setError("Ett fel uppstod vid hämtning."); setListings([]); } finally { setLoading(false); }
    };
    fetchListings();
  }, []);

  return (
    <section className="py-24 bg-muted/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Utvalda</p>
            <h2 className="text-3xl font-bold text-navy tracking-tight">Utvalda lokaler</h2>
          </div>
          <Link href="/annonser" className="hidden sm:inline-block text-[13px] font-semibold text-navy/50 hover:text-navy transition-colors tracking-wide">
            Visa alla &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border/40 overflow-hidden">
                <div className="h-48 bg-muted shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded-lg w-3/4" />
                  <div className="h-3 bg-muted rounded-lg w-1/2" />
                  <div className="h-3 bg-muted rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="py-16 px-6 bg-white rounded-2xl border border-border/40 text-center">
            <p className="text-gray-400 mb-4 text-sm">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="text-[13px] font-semibold text-navy hover:underline">Ladda om sidan</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="sm:hidden mt-10 text-center">
          <Link href="/annonser" className="text-[13px] font-semibold text-navy/50 hover:text-navy transition-colors">
            Visa alla annonser &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
