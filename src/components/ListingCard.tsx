"use client";

import Link from "next/link";
import Image from "next/image";
import { typeLabels, formatCategories } from "@/lib/types";
import type { Listing } from "@/lib/types";
import PlaceholderImage from "./PlaceholderImage";
import FavoriteButton from "./FavoriteButton";

interface ListingCardProps {
  listing: Listing;
  favorited?: boolean;
}

export default function ListingCard({ listing, favorited: initialFavorited }: ListingCardProps) {
  const formatPriceDisplay = (price: number, type: string) => {
    return price.toLocaleString("sv-SE") + (type === "sale" ? " kr" : " kr/mån");
  };

  const hasImage = listing.imageUrl && listing.imageUrl.trim() !== "";

  return (
    <Link
      href={`/annonser/${listing.id}`}
      className="block group"
      aria-label={`${listing.title}, ${listing.address}, ${listing.city}, ${listing.size} m²`}
    >
      <div className="bg-white rounded-2xl border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group">
        {/* Image area */}
        <div className="relative h-52 overflow-hidden">
          {hasImage ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <PlaceholderImage category={listing.category} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-navy/90 text-white backdrop-blur-sm tracking-wide">
              {typeLabels[listing.type]}
            </span>
            <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-white/80 text-navy/70 backdrop-blur-sm tracking-wide">
              {formatCategories(listing.category)}
            </span>
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <FavoriteButton listingId={listing.id} initialFavorited={initialFavorited} />
            {listing.featured && (
              <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-white/90 text-navy backdrop-blur-sm tracking-wide">
                Utvald
              </span>
            )}
          </div>

          {/* Price overlay on hover */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <span className="px-3 py-1.5 text-sm font-bold text-white bg-navy/90 rounded-lg backdrop-blur-sm">
              {formatPriceDisplay(listing.price, listing.type)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-semibold text-navy text-[15px] mb-1 line-clamp-1 group-hover:text-navy-light transition-colors tracking-tight leading-snug">
            {listing.title}
          </h3>
          <p className="text-[12px] text-gray-400 mb-3 tracking-wide">
            {listing.address}, {listing.city}
          </p>
          <p className="text-[13px] text-gray-400 line-clamp-2 mb-4 leading-relaxed">{listing.description}</p>

          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-gray-400 tracking-wide">{listing.size} m²</span>
              {listing.tags && listing.tags.length > 0 && (
                <span className="text-[11px] text-navy/30 tracking-wide">{listing.tags[0]}</span>
              )}
            </div>
            <span className="text-base font-bold text-navy tracking-tight">{formatPriceDisplay(listing.price, listing.type)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
