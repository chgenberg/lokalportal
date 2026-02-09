"use client";

import Link from "next/link";
import { typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";
import PlaceholderImage from "./PlaceholderImage";

interface ListingCardProps { listing: Listing; }

export default function ListingCard({ listing }: ListingCardProps) {
  const formatPrice = (price: number, type: string) => {
    if (type === "sale") return `${(price / 1000000).toFixed(1)} mkr`;
    return `${price.toLocaleString("sv-SE")} kr/man`;
  };

  return (
    <Link href={`/annonser/${listing.id}`} className="block group">
      <div className="card-glow bg-white rounded-2xl border border-border/60 overflow-hidden">
        <div className="relative h-48 overflow-hidden">
          <PlaceholderImage category={listing.category} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-navy/90 text-white backdrop-blur-sm tracking-wide">
              {typeLabels[listing.type]}
            </span>
            {listing.featured && (
              <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-white/80 text-navy backdrop-blur-sm tracking-wide">
                Utvald
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-navy text-[15px] mb-1.5 line-clamp-2 group-hover:text-navy-light transition-colors tracking-tight leading-snug">
            {listing.title}
          </h3>
          <p className="text-[12px] text-gray-400 mb-3 tracking-wide">
            {listing.address}, {listing.city}
          </p>
          <p className="text-[13px] text-gray-400 line-clamp-2 mb-4 leading-relaxed">{listing.description}</p>
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <span className="text-[12px] text-gray-400 tracking-wide">{listing.size} m&sup2;</span>
            <span className="text-base font-bold text-navy tracking-tight">{formatPrice(listing.price, listing.type)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
