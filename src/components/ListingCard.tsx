"use client";

import Link from "next/link";
import { typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";
import PlaceholderImage from "./PlaceholderImage";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const formatPrice = (price: number, type: string) => {
    if (type === "sale") return `${(price / 1000000).toFixed(1)} mkr`;
    return `${price.toLocaleString("sv-SE")} kr/mån`;
  };

  return (
    <Link href={`/annonser/${listing.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-navy/20 transition-all duration-300 hover:-translate-y-1">
        <div className="relative h-52 overflow-hidden">
          <PlaceholderImage category={listing.category} className="h-full w-full" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-navy text-white">
              {typeLabels[listing.type]}
            </span>
            {listing.featured && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/90 text-navy border border-border">
                Utvald
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-navy text-base mb-2 line-clamp-2 group-hover:text-navy-light transition-colors">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {listing.address}, {listing.city}
          </p>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{listing.description}</p>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-sm text-gray-500">{listing.size} m²</span>
            <span className="text-lg font-bold text-navy">{formatPrice(listing.price, listing.type)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
