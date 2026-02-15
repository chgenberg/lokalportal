"use client";

import { lazy, Suspense, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCategories, typeLabels, getListingImages } from "@/lib/types";
import type { Listing, NearbyData, DemographicsData, PriceContext } from "@/lib/types";
import PlaceholderImage from "@/components/PlaceholderImage";

const ListingMap = lazy(() => import("@/components/ListingMap"));

function formatPrice(price: number, type: string) {
  return `${price.toLocaleString("sv-SE")} ${type === "sale" ? "kr" : "kr/mån"}`;
}

interface ListingDetailContentProps {
  listing: Listing;
  showBackLink?: boolean;
  /** When true, skip min-h-screen so the block fits inside a modal or container. */
  compact?: boolean;
  /** When provided, rendered inside the contact card below name/email/phone (e.g. contact buttons or preview message). */
  contactSlot: React.ReactNode;
  /** When true, description can be edited via Redigera toggle. Requires onDescriptionChange. */
  editableDescription?: boolean;
  /** Called when user saves edited description. Required if editableDescription. */
  onDescriptionChange?: (description: string) => void;
  /** Optional area analysis data (demographics, nearby amenities, price context). */
  areaData?: {
    demographics: DemographicsData | null;
    nearby: NearbyData;
    priceContext: PriceContext | null;
  };
}

export default function ListingDetailContent({
  listing,
  showBackLink = true,
  compact = false,
  contactSlot,
  editableDescription = false,
  onDescriptionChange,
  areaData,
}: ListingDetailContentProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDraft, setEditDraft] = useState(listing.description || "");
  const images = getListingImages(listing);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [primaryImageError, setPrimaryImageError] = useState(false);

  useEffect(() => {
    if (isEditingDescription) setEditDraft(listing.description || "");
  }, [listing.description, isEditingDescription]);

  useEffect(() => {
    setPrimaryImageError(false);
  }, [images[0]]);

  return (
    <div className={`bg-muted/30 ${compact ? "" : "min-h-screen"}`}>
      {showBackLink && (
        <div className="bg-navy relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-light opacity-90" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-4">
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
        <div className="mb-8">
          <div className={`relative rounded-2xl overflow-hidden border border-border/40 shadow-lg shadow-navy/[0.06] ${compact ? "h-48 sm:h-72" : "h-72 sm:h-96"}`}>
            {images.length > 0 && !primaryImageError ? (
              <>
                <Image
                  src={images[0]!}
                  alt={listing.title}
                  fill
                  className="object-cover cursor-pointer"
                  sizes="(max-width: 1024px) 100vw, 960px"
                  priority={showBackLink}
                  unoptimized={images[0]!.includes("/api/upload/")}
                  onError={() => setPrimaryImageError(true)}
                  onClick={() => images.length > 1 && setLightboxIndex(0)}
                />
                {images.length > 1 && !compact && (
                  <div className="absolute bottom-14 left-6 flex gap-2">
                    {images.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                        className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/80 hover:border-white shadow-md shrink-0"
                      >
                        <Image src={url} alt="" width={48} height={48} className="object-cover w-full h-full" unoptimized={url.includes("/api/upload/")} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="relative w-full h-full">
                <PlaceholderImage category={listing.category} className="h-full w-full" />
                {primaryImageError && (
                  <p className="absolute bottom-4 left-4 right-4 text-center text-[12px] text-gray-600 bg-white/90 py-2 rounded-lg shadow-sm">Bilden kunde inte laddas – filen finns inte längre. Ladda upp på nytt.</p>
                )}
              </div>
            )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/90 text-navy backdrop-blur-sm tracking-wide">
                {typeLabels[listing.type]}
              </span>
              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/70 text-navy/70 backdrop-blur-sm tracking-wide">
                {formatCategories(listing.category)}
              </span>
              {listing.featured && (
                <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-gold text-navy backdrop-blur-sm tracking-wide">
                  Utvald
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg tracking-tight">{listing.title}</h1>
          </div>
        </div>

          {lightboxIndex !== null && images.length > 0 && (
            <div
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
              onClick={() => setLightboxIndex(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Escape" && setLightboxIndex(null)}
              aria-label="Stäng bildvisning"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 w-10 h-10 text-white/80 hover:text-white text-2xl"
                aria-label="Stäng"
              >
                &times;
              </button>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label="Föregående"
                  >
                    &larr;
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20"
                    aria-label="Nästa"
                  >
                    &rarr;
                  </button>
                </>
              )}
              <div className="relative max-w-5xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
                <Image src={images[lightboxIndex]!} alt={listing.title} width={1200} height={675} className="object-contain max-h-[90vh] w-auto" unoptimized />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">
              {/* Nyckeltal */}
              <div className="grid grid-cols-4 gap-0 border-b border-border/40">
                <div className="text-center py-4 px-2">
                  <p className="text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-0.5">Pris</p>
                  <p className="text-sm font-bold text-navy tracking-tight whitespace-nowrap">{formatPrice(listing.price, listing.type)}</p>
                </div>
                <div className="text-center py-4 px-2 border-l border-border/40">
                  <p className="text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-0.5">Storlek</p>
                  <p className="text-sm font-bold text-navy tracking-tight whitespace-nowrap">{listing.size} m²</p>
                </div>
                <div className="text-center py-4 px-2 border-l border-border/40">
                  <p className="text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-0.5">Kr/m²</p>
                  <p className="text-sm font-bold text-navy tracking-tight whitespace-nowrap">
                    {listing.size > 0
                      ? `${Math.round(listing.price / listing.size).toLocaleString("sv-SE")} ${listing.type === "rent" ? "kr/m²/mån" : "kr/m²"}`
                      : "—"}
                  </p>
                </div>
                <div className="text-center py-4 px-2 border-l border-border/40">
                  <p className="text-[10px] font-semibold text-gray-400 tracking-[0.12em] uppercase mb-0.5">Plats</p>
                  <p className="text-sm font-bold text-navy tracking-tight whitespace-nowrap">{listing.city}</p>
                </div>
              </div>

              {/* Adress */}
              <div className="px-6 py-4 border-b border-border/40">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Adress</p>
                <p className="text-[15px] text-navy font-medium">
                  {listing.address}, {listing.city}
                </p>
              </div>

              {/* Egenskaper */}
              {listing.tags && listing.tags.length > 0 && (
                <div className="px-6 py-4">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-2">Egenskaper</p>
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

              {/* Beskrivning – i samma kort */}
              <div className="px-6 py-5 border-t border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase">Beskrivning</p>
                  {editableDescription && onDescriptionChange && !isEditingDescription && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft(listing.description || "");
                        setIsEditingDescription(true);
                      }}
                      className="text-[12px] text-navy/60 hover:text-navy transition-colors"
                    >
                      Redigera
                    </button>
                  )}
                  {editableDescription && onDescriptionChange && isEditingDescription && (
                    <button
                      type="button"
                      onClick={() => {
                        onDescriptionChange(editDraft.trim().slice(0, 5000));
                        setIsEditingDescription(false);
                      }}
                      className="text-[12px] font-medium text-navy hover:underline"
                    >
                      Klart
                    </button>
                  )}
                </div>
                {editableDescription && onDescriptionChange && isEditingDescription ? (
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    className="w-full min-h-[200px] p-4 text-[15px] text-gray-600 leading-[1.7] border border-border/60 rounded-xl focus:border-navy/30 focus:outline-none resize-y"
                    placeholder="Skriv beskrivningen här..."
                    maxLength={5000}
                  />
                ) : (
                  <div className="text-[15px] text-gray-600 leading-[1.7] max-w-[65ch]">
                    {listing.description ? (
                      (() => {
                        // Split on double newlines first, then single newlines
                        let blocks = listing.description.split(/\n\n+/).filter(b => b.trim());
                        if (blocks.length <= 1) {
                          blocks = listing.description.split(/\n/).filter(b => b.trim());
                        }
                        // If still one block and long, split by sentences
                        if (blocks.length <= 1 && listing.description.length > 300) {
                          const sentences = listing.description.match(/[^.!?]+[.!?]+/g) || [listing.description];
                          const chunkSize = Math.max(1, Math.ceil(sentences.length / 5));
                          blocks = [];
                          for (let i = 0; i < sentences.length; i += chunkSize) {
                            blocks.push(sentences.slice(i, i + chunkSize).join(" ").trim());
                          }
                        }
                        return blocks.map((block, i) => (
                          <p key={i} className="mb-4 last:mb-0">
                            {block.trim()}
                          </p>
                        ));
                      })()
                    ) : (
                      <p className="text-gray-400">Ingen beskrivning tillagd.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bildgalleri – alla bilder i rutnät */}
            {images.length > 1 && (
              <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Bilder ({images.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/40 hover:border-navy/30 hover:shadow-md transition-all group"
                    >
                      <Image
                        src={url}
                        alt={`${listing.title} – bild ${i + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        unoptimized={url.includes("/api/upload/")}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {("videoUrl" in listing && listing.videoUrl) && (
              <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Video</p>
                <div className="rounded-xl overflow-hidden border border-border/40 bg-black/5">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video src={listing.videoUrl} controls className="w-full max-h-[400px]" />
                </div>
              </div>
            )}

            {("floorPlanImageUrl" in listing && listing.floorPlanImageUrl) && (
              <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Planlösning</p>
                <div className="rounded-xl overflow-hidden border border-border/40 bg-muted/20">
                  <Image src={listing.floorPlanImageUrl} alt="Planlösning" width={800} height={600} className="w-full h-auto object-contain max-h-[500px]" unoptimized />
                </div>
              </div>
            )}

            {/* Lägesanalys – visuella poängkort */}
            {areaData?.nearby && (areaData.nearby.restaurants > 0 || areaData.nearby.shops > 0 || areaData.nearby.busStops.count > 0 || areaData.nearby.trainStations.count > 0 || areaData.nearby.parking > 0 || areaData.nearby.schools > 0 || areaData.nearby.healthcare > 0 || areaData.nearby.gyms > 0) && (() => {
              const n = areaData.nearby;
              const categories = [
                { label: "Kollektivtrafik", count: n.busStops.count + n.trainStations.count, detail: [n.busStops.count > 0 ? `${n.busStops.count} busshållplatser` : "", n.trainStations.count > 0 ? `${n.trainStations.count} tågstationer` : ""].filter(Boolean) },
                { label: "Restauranger", count: n.restaurants, detail: [`${n.restaurants} restauranger`] },
                { label: "Parkering", count: n.parking, detail: [`${n.parking} parkeringar`] },
                { label: "Butiker", count: n.shops, detail: [`${n.shops} butiker`] },
                { label: "Skolor", count: n.schools, detail: [`${n.schools} skolor`] },
                { label: "Vård & apotek", count: n.healthcare, detail: [`${n.healthcare} vård/apotek`] },
                { label: "Gym", count: n.gyms, detail: [`${n.gyms} gym`] },
              ].filter(c => c.count > 0);
              return (
                <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Lägesanalys</p>
                  <p className="text-[12px] text-gray-400 mb-5">Inom 2,5 km från lokalen</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {categories.map((cat, i) => {
                      const score = Math.min(cat.count, 5);
                      return (
                        <div key={i} className="bg-muted/40 rounded-xl p-4">
                          <p className="text-[12px] font-semibold text-navy mb-2">{cat.label}</p>
                          <div className="flex items-center gap-1.5 mb-2">
                            {Array.from({ length: 5 }).map((_, di) => (
                              <div key={di} className={`w-2.5 h-2.5 rounded-full ${di < score ? "bg-gold" : "bg-border"}`} />
                            ))}
                            <span className="text-[11px] font-bold text-navy ml-1">{score}/5</span>
                          </div>
                          {cat.detail.map((d, j) => (
                            <p key={j} className="text-[11px] text-gray-500">{d}</p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Områdesstatistik – demografi */}
            {areaData?.demographics && (
              <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Områdesstatistik</p>
                <p className="text-[12px] text-gray-400 mb-5">{areaData.demographics.city || listing.city}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {areaData.demographics.population > 0 && (
                    <div className="text-center bg-muted/40 rounded-xl p-4">
                      <p className="text-xl font-bold text-navy">{areaData.demographics.population.toLocaleString("sv-SE")}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Invånare</p>
                    </div>
                  )}
                  {areaData.demographics.medianIncome && (
                    <div className="text-center bg-muted/40 rounded-xl p-4">
                      <p className="text-xl font-bold text-navy">{areaData.demographics.medianIncome} tkr</p>
                      <p className="text-[11px] text-gray-500 mt-1">Medianinkomst/år</p>
                    </div>
                  )}
                  {areaData.demographics.workingAgePercent && (
                    <div className="text-center bg-muted/40 rounded-xl p-4">
                      <p className="text-xl font-bold text-navy">{areaData.demographics.workingAgePercent}%</p>
                      <p className="text-[11px] text-gray-500 mt-1">Arbetsför ålder</p>
                    </div>
                  )}
                  {areaData.demographics.totalBusinesses && (
                    <div className="text-center bg-muted/40 rounded-xl p-4">
                      <p className="text-xl font-bold text-navy">{areaData.demographics.totalBusinesses.toLocaleString("sv-SE")}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Företag</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-4">Källa: SCB, BRÅ, OpenStreetMap</p>
              </div>
            )}

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
              {listing.owner?.role === "agent" && listing.owner?.logoUrl && (
                <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Mäklare</p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      <Image src={listing.owner.logoUrl} alt={listing.owner.companyName || listing.owner.name} width={56} height={56} className="object-contain w-full h-full" unoptimized />
                    </div>
                    {(listing.owner.companyName || listing.owner.name) && (
                      <p className="text-sm font-medium text-navy">{listing.owner.companyName || listing.owner.name}</p>
                    )}
                  </div>
                </div>
              )}
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
                        href={`tel:${(listing.contact.phone ?? "").replace(/\s/g, "")}`}
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
                    <span className="text-[13px] font-medium text-navy">{formatCategories(listing.category)}</span>
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
