"use client";

import { MapPin, Maximize2, Tag } from "lucide-react";
import { categoryLabels, typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const formatPrice = (price: number, type: string) => {
    if (type === "sale") {
      return `${(price / 1000000).toFixed(1)} mkr`;
    }
    return `${price.toLocaleString("sv-SE")} kr/mån`;
  };

  return (
    <div className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image placeholder */}
      <div className="relative h-52 bg-gradient-to-br from-muted to-muted-dark overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-white/80 flex items-center justify-center">
              <Tag className="w-7 h-7 text-navy/40" />
            </div>
            <span className="text-xs text-gray-400">{categoryLabels[listing.category]}</span>
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            listing.type === "rent"
              ? "bg-accent text-white"
              : "bg-emerald-500 text-white"
          }`}>
            {typeLabels[listing.type]}
          </span>
          {listing.featured && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-400 text-amber-900">
              Utvald
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-navy text-base mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {listing.title}
        </h3>

        <div className="flex items-center gap-1.5 text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-sm">{listing.address}, {listing.city}</span>
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 mb-4">
          {listing.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{listing.size} m²</span>
          </div>
          <span className="text-lg font-bold text-navy">
            {formatPrice(listing.price, listing.type)}
          </span>
        </div>
      </div>
    </div>
  );
}
