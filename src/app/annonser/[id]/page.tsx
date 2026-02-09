"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { categoryLabels, typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";
import PlaceholderImage from "@/components/PlaceholderImage";

const ListingMap = lazy(() => import("@/components/ListingMap"));

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) { setError(res.status === 404 ? "Annonsen hittades inte." : "Kunde inte ladda annonsen."); setListing(null); return; }
        setListing(await res.json());
      } catch { setError("Ett fel uppstod."); setListing(null); } finally { setLoading(false); }
    };
    if (id) fetchListing();
  }, [id]);

  const handleContact = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (!session?.user) { router.push(`/logga-in?callback=/annonser/${id}`); return; }
      const convRes = await fetch("/api/messages/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: id }) });
      if (convRes.ok) { const conv = await convRes.json(); router.push(`/dashboard/meddelanden?conv=${conv.id}`); }
    } catch { router.push(`/logga-in?callback=/annonser/${id}`); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-navy h-72" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32">
          <div className="bg-white rounded-2xl border border-border/40 overflow-hidden shadow-lg shadow-navy/[0.04]">
            <div className="h-80 bg-gradient-to-br from-muted to-muted/50 shimmer" />
            <div className="p-8 space-y-4">
              <div className="h-6 bg-muted/80 rounded-lg w-2/3" />
              <div className="h-4 bg-muted/60 rounded-lg w-1/3" />
              <div className="h-4 bg-muted/40 rounded-lg w-full" />
              <div className="h-4 bg-muted/40 rounded-lg w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-navy h-48" />
        <div className="max-w-2xl mx-auto px-4 -mt-16">
          <div className="bg-white rounded-2xl border border-border/40 p-12 text-center shadow-lg shadow-navy/[0.04]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-navy/[0.04] flex items-center justify-center">
              <span className="text-xl font-bold text-navy/30">!</span>
            </div>
            <p className="text-gray-500 mb-6">{error ?? "Annonsen hittades inte."}</p>
            <Link href="/annonser" className="btn-glow inline-block px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg">
              &larr; Alla annonser
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, type: string) => type === "sale" ? `${(price / 1000000).toFixed(1)} mkr` : `${price.toLocaleString("sv-SE")} kr/mån`;
  const hasImage = listing.imageUrl && listing.imageUrl.trim() !== "";

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const listingJsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: listing.title, description: listing.description,
    category: categoryLabels[listing.category],
    offers: { "@type": "Offer", price: listing.price, priceCurrency: "SEK" },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Storlek", value: `${listing.size} m²` },
      { "@type": "PropertyValue", name: "Adress", value: `${listing.address}, ${listing.city}` },
    ],
    url: `${baseUrl}/annonser/${listing.id}`,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }} />

      {/* Hero image */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-light opacity-90" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-4">
          <Link href="/annonser" className="inline-block text-[12px] text-white/40 hover:text-white/70 mb-4 transition-colors tracking-wide">
            &larr; Tillbaka till alla annonser
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-16">
        {/* Main image */}
        <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden border border-border/40 shadow-lg shadow-navy/[0.06] mb-8">
          {hasImage ? (
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 960px"
              priority
            />
          ) : (
            <PlaceholderImage category={listing.category} className="h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/90 text-navy backdrop-blur-sm tracking-wide">{typeLabels[listing.type]}</span>
              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/70 text-navy/70 backdrop-blur-sm tracking-wide">{categoryLabels[listing.category]}</span>
              {listing.featured && <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-navy/90 text-white backdrop-blur-sm tracking-wide">Utvald</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg tracking-tight">{listing.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key info bar */}
            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Pris</p>
                  <p className="text-xl font-bold text-navy tracking-tight">{formatPrice(listing.price, listing.type)}</p>
                </div>
                <div className="text-center border-x border-border/40">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Storlek</p>
                  <p className="text-xl font-bold text-navy tracking-tight">{listing.size} m&sup2;</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Plats</p>
                  <p className="text-lg font-bold text-navy tracking-tight">{listing.city}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-2">Adress</p>
              <p className="text-[15px] text-navy font-medium">{listing.address}, {listing.city}</p>
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Egenskaper</p>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1.5 text-[12px] font-medium rounded-full bg-navy/[0.04] text-navy/70 border border-navy/[0.08] hover:bg-navy/[0.08] transition-colors cursor-default">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Beskrivning</p>
              <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Map */}
            {listing.lat && listing.lng && (
              <div className="bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-6 pb-0">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase">Plats på karta</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-navy/50 hover:text-navy transition-colors tracking-wide">
                    Öppna i Google Maps &rarr;
                  </a>
                </div>
                <div className="h-72 mt-4">
                  <Suspense fallback={<div className="w-full h-full bg-muted flex items-center justify-center"><div className="text-gray-400 text-sm">Laddar karta...</div></div>}>
                    <ListingMap listings={[listing]} center={[listing.lat, listing.lng]} zoom={15} singleMarker />
                  </Suspense>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-4">
              {/* Contact card */}
              <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Kontakt</p>
                <div className="space-y-3 mb-6">
                  <div>
                    <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Namn</p>
                    <p className="text-sm font-medium text-navy">{listing.contact.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">E-post</p>
                    <a href={`mailto:${listing.contact.email}`} className="text-sm font-medium text-navy hover:underline">{listing.contact.email}</a>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Telefon</p>
                    <a href={`tel:${listing.contact.phone.replace(/\s/g, "")}`} className="text-sm font-medium text-navy hover:underline">{listing.contact.phone}</a>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={handleContact} className="btn-glow w-full py-3 px-4 bg-navy text-white text-center text-sm font-semibold rounded-xl">
                    Kontakta hyresvärd
                  </button>
                  <a href={`mailto:${listing.contact.email}`} className="w-full py-3 px-4 border border-navy/20 text-navy text-center text-sm font-medium rounded-xl hover:bg-navy/[0.03] transition-colors">
                    Skicka e-post
                  </a>
                  <a href={`tel:${listing.contact.phone.replace(/\s/g, "")}`} className="w-full py-3 px-4 border border-border/60 text-gray-500 text-center text-sm font-medium rounded-xl hover:bg-muted/50 transition-colors">
                    Ring
                  </a>
                </div>
              </div>

              {/* Quick facts */}
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
                    <span className="text-[13px] font-medium text-navy">{listing.size} m&sup2;</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[12px] text-gray-400 tracking-wide">Publicerad</span>
                    <span className="text-[13px] font-medium text-navy">
                      {new Date(listing.createdAt).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" })}
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
