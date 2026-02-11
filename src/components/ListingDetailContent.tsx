"use client";

import { lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { categoryLabels, typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";
import PlaceholderImage from "@/components/PlaceholderImage";

const ListingMap = lazy(() => import("@/components/ListingMap"));

function formatPrice(price: number, type: string) {
  return type === "sale" ? `${(price / 1_000_000).toFixed(1)} mkr` : `${price.toLocaleString("sv-SE")} kr/mån`;
}

interface ListingDetailContentProps {
  listing: Listing;
  showBackLink?: boolean;
  /** When true, skip min-h-screen so the block fits inside a modal or container. */
  compact?: boolean;
  /** When provided, rendered inside the contact card below name/email/phone (e.g. contact buttons or preview message). */
  contactSlot: React.ReactNode;
}

export default function ListingDetailContent({
  listing,
  showBackLink = true,
  compact = false,
  contactSlot,
}: ListingDetailContentProps) {
  const hasImage = listing.imageUrl && listing.imageUrl.trim() !== "";

  return (
    <div className={`bg-muted/30 ${compact ? "" : "min-h-screen"}`}>
      {showBackLink && (
        <div className="bg-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-light opacity-90" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-4">
            <Link
              href="/annonser"
              className="inline-block text-[12px] text-white/40 hover:text-white/70 mb-4 transition-colors tracking-wide"
            >
              &larr; Tillbaka till alla annonser
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-16">
        <div className={`relative rounded-2xl overflow-hidden border border-border/40 shadow-lg shadow-navy/[0.06] mb-8 ${compact ? "h-48 sm:h-72" : "h-72 sm:h-96"}`}>
          {hasImage ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 960px"
              priority={showBackLink}
            />
          ) : (
            <PlaceholderImage category={listing.category} className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/90 text-navy backdrop-blur-sm tracking-wide">
                {typeLabels[listing.type]}
              </span>
              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/70 text-navy/70 backdrop-blur-sm tracking-wide">
                {categoryLabels[listing.category]}
              </span>
              {listing.featured && (
                <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-navy/90 text-white backdrop-blur-sm tracking-wide">
                  Utvald
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg tracking-tight">{listing.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Pris</p>
                  <p className="text-lg sm:text-xl font-bold text-navy tracking-tight">{formatPrice(listing.price, listing.type)}</p>
                </div>
                <div className="text-center sm:border-x border-border/40">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Storlek</p>
                  <p className="text-lg sm:text-xl font-bold text-navy tracking-tight">{listing.size} m²</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Plats</p>
                  <p className="text-lg font-bold text-navy tracking-tight">{listing.city}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-2">Adress</p>
              <p className="text-[15px] text-navy font-medium">
                {listing.address}, {listing.city}
              </p>
            </div>

            {listing.tags && listing.tags.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Egenskaper</p>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 text-[12px] font-medium rounded-full bg-navy/[0.04] text-navy/70 border border-navy/[0.08] hover:bg-navy/[0.08] transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Beskrivning</p>
              <div className="text-[15px] text-gray-600 leading-[1.7] max-w-[65ch]">
                {listing.description ? (
                  listing.description.split(/\n\n+/).map((block, i) => (
                    <p key={i} className="mb-4 last:mb-0 whitespace-pre-line">
                      {block.trim()}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-400">Ingen beskrivning tillagd.</p>
                )}
              </div>
            </div>

            {listing.lat && listing.lng && (
              <div className="bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-6 pb-0">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase">Plats på karta</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-navy/50 hover:text-navy transition-colors tracking-wide"
                  >
                    Öppna i Google Maps &rarr;
                  </a>
                </div>
                <div className="h-72 mt-4">
                  <Suspense
                    fallback={
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <div className="text-gray-400 text-sm">Laddar karta...</div>
                      </div>
                    }
                  >
                    <ListingMap
                      listings={[listing]}
                      center={[listing.lat, listing.lng]}
                      zoom={15}
                      singleMarker
                    />
                  </Suspense>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-4">
              <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Kontakt</p>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Namn</p>
                    <p className="text-sm font-medium text-navy">{listing.contact?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">E-post</p>
                    {listing.contact?.email ? (
                      <a href={`mailto:${listing.contact.email}`} className="text-sm font-medium text-navy hover:underline">
                        {listing.contact.email}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-navy">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Telefon</p>
                    {listing.contact?.phone ? (
                      <a
                        href={`tel:${listing.contact.phone.replace(/\s/g, "")}`}
                        className="text-sm font-medium text-navy hover:underline"
                      >
                        {listing.contact.phone}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-navy">—</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">{contactSlot}</div>
              </div>

              <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Snabbfakta</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-[12px] text-gray-400 tracking-wide">Typ</span>
                    <span className="text-[13px] font-medium text-navy">{typeLabels[listing.type]}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-[12px] text-gray-400 tracking-wide">Kategori</span>
                    <span className="text-[13px] font-medium text-navy">{categoryLabels[listing.category]}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-[12px] text-gray-400 tracking-wide">Storlek</span>
                    <span className="text-[13px] font-medium text-navy">{listing.size} m²</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[12px] text-gray-400 tracking-wide">Publicerad</span>
                    <span className="text-[13px] font-medium text-navy">
                      {new Date(listing.createdAt).toLocaleDateString("sv-SE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { formatPrice as formatPriceListing };
