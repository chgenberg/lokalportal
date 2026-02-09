"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ListingCard from "./ListingCard";
import type { Listing } from "@/lib/types";
import { ArrowRight } from "lucide-react";

export default function FeaturedListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch("/api/listings?featured=true");
        if (!res.ok) {
          setError("Kunde inte ladda utvalda lokaler. Försök igen senare.");
          setListings([]);
          return;
        }
        const data = await res.json();
        setListings(data.slice(0, 4));
      } catch {
        setError("Ett fel uppstod vid hämtning av lokaler. Försök igen senare.");
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-14">
          <div>
            <h2 className="text-3xl font-bold text-navy mb-3">
              Utvalda lokaler
            </h2>
            <p className="text-gray-500">
              Handplockade lokaler med bästa läge och villkor
            </p>
          </div>
          <Link
            href="/annonser"
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
          >
            Visa alla
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border overflow-hidden"
              >
                <div className="h-52 bg-muted-dark animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted-dark rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted-dark rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted-dark rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 px-6 bg-white rounded-2xl border border-border text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-accent hover:underline"
            >
              Ladda om sidan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="sm:hidden mt-8 text-center">
          <Link
            href="/annonser"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
          >
            Visa alla annonser
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
