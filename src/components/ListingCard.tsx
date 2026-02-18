"use client";

import Link from "next/link";
import Image from "next/image";
import { typeLabels, formatCategories, getListingImages } from "@/lib/types";
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

  const images = getListingImages(listing);
  const primaryImage = images[0];
  const hasImage = !!primaryImage?.trim();

  return (
    <Link
      href={`/annonser/${listing.id}`}
      className="block group"
      aria-label={`${listing.title}, ${listing.address}, ${listing.city}, ${listing.size} m²`}
    >
      <div className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          {hasImage ? (
            <Image
              src={primaryImage}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <PlaceholderImage category={listing.category} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
          )}

          {/* Favorite button */}
          <div className="absolute top-3 right-3">
            <FavoriteButton listingId={listing.id} initialFavorited={initialFavorited} />
          </div>

          {/* Image count indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {images.slice(0, Math.min(images.length, 5)).map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-3 pb-1">
          <h3 className="font-semibold text-navy text-[15px] mb-0.5 line-clamp-1 tracking-tight">
            {listing.title}
          </h3>
          <p className="text-[13px] text-gray-400 mb-1">
            {formatCategories(listing.category)} · {listing.size} m²
          </p>
          <p className="text-[13px] text-gray-400 mb-1.5">
            {listing.address}, {listing.city}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              {typeLabels[listing.type]}
            </span>
            <span className="text-sm font-bold text-navy">
              {formatPriceDisplay(listing.price, listing.type)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
