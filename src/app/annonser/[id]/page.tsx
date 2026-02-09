"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Maximize2,
  Mail,
  Phone,
  User,
  ExternalLink,
  MessageCircle,
  Map,
} from "lucide-react";
import { categoryLabels, typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";

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
        if (!res.ok) {
          if (res.status === 404) setError("Annonsen hittades inte.");
          else setError("Kunde inte ladda annonsen.");
          setListing(null);
          return;
        }
        const data = await res.json();
        setListing(data);
      } catch {
        setError("Ett fel uppstod. Försök igen senare.");
        setListing(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id]);

  const handleContact = async () => {
    // Check if user is logged in
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (!session?.user) {
        router.push(`/logga-in?callback=/annonser/${id}`);
        return;
      }
      // Start conversation
      const convRes = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      if (convRes.ok) {
        const conv = await convRes.json();
        router.push(`/dashboard/meddelanden?conv=${conv.id}`);
      }
    } catch {
      router.push(`/logga-in?callback=/annonser/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Laddar...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-600 mb-6">{error ?? "Annonsen hittades inte."}</p>
          <Link
            href="/annonser"
            className="inline-flex items-center gap-2 text-accent font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till alla annonser
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, type: string) => {
    if (type === "sale") return `${(price / 1000000).toFixed(1)} mkr`;
    return `${price.toLocaleString("sv-SE")} kr/mån`;
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    category: categoryLabels[listing.category],
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "SEK",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Storlek", value: `${listing.size} m²` },
      { "@type": "PropertyValue", name: "Adress", value: `${listing.address}, ${listing.city}` },
    ],
    url: `${baseUrl}/annonser/${listing.id}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/annonser"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till alla annonser
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  listing.type === "rent" ? "bg-accent text-white" : "bg-emerald-500 text-white"
                }`}
              >
                {typeLabels[listing.type]}
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-gray-600">
                {categoryLabels[listing.category]}
              </span>
              {listing.featured && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-400 text-amber-900">
                  Utvald
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-navy mb-4">
              {listing.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-gray-500 mb-6">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {listing.address}, {listing.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4" />
                {listing.size} m²
              </span>
            </div>

            <div className="text-2xl font-bold text-navy mb-8">
              {formatPrice(listing.price, listing.type)}
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-gray-600 border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-gray max-w-none mb-8">
              <h2 className="text-lg font-semibold text-navy mb-2">Beskrivning</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Mini Map */}
            {listing.lat && listing.lng && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
                    <Map className="w-5 h-5" />
                    Plats
                  </h2>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-accent hover:underline"
                  >
                    Öppna i Google Maps
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="h-64 rounded-xl overflow-hidden border border-border">
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

          {/* Contact card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-muted/50 p-6">
              <h2 className="text-lg font-semibold text-navy mb-4">Kontakt</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{listing.contact.name}</span>
                </div>
                <a
                  href={`mailto:${listing.contact.email}`}
                  className="flex items-center gap-3 text-sm text-accent hover:underline"
                >
                  <Mail className="w-5 h-5 shrink-0" />
                  {listing.contact.email}
                </a>
                <a
                  href={`tel:${listing.contact.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-sm text-accent hover:underline"
                >
                  <Phone className="w-5 h-5 shrink-0" />
                  {listing.contact.phone}
                </a>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={handleContact}
                  className="w-full py-3 px-4 bg-accent text-white text-center text-sm font-medium rounded-xl hover:bg-accent-dark transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Kontakta hyresvärd
                </button>
                <a
                  href={`mailto:${listing.contact.email}`}
                  className="w-full py-3 px-4 bg-navy text-white text-center text-sm font-medium rounded-xl hover:bg-navy-light transition-colors"
                >
                  Skicka e-post
                </a>
                <a
                  href={`tel:${listing.contact.phone.replace(/\s/g, "")}`}
                  className="w-full py-3 px-4 border border-navy text-navy text-center text-sm font-medium rounded-xl hover:bg-navy/5 transition-colors"
                >
                  Ring
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
