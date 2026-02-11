"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { categoryLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";
import FavoriteButton from "@/components/FavoriteButton";
import ListingDetailContent from "@/components/ListingDetailContent";
import { downloadListingPdf } from "@/lib/pdf-listing";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!id) return;
    const checkFavorited = async () => {
      try {
        const res = await fetch(`/api/favorites?check=${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          setFavorited(!!data.favorited);
        }
      } catch { /* ignore */ }
    };
    checkFavorited();
  }, [id]);

  const handleContact = async () => {
    setContactError(null);
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      if (!session?.user) { router.push(`/logga-in?callback=/annonser/${id}`); return; }
      setContactLoading(true);
      const convRes = await fetch("/api/messages/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: id }) });
      if (convRes.ok) {
        const conv = await convRes.json();
        router.push(`/dashboard/meddelanden?conv=${conv.id}`);
        return;
      }
      const data = await convRes.json().catch(() => ({}));
      const message = data?.error ?? "Kunde inte starta konversation.";
      setContactError(message);
    } catch {
      setContactError("Något gick fel. Försök igen eller logga in.");
    } finally {
      setContactLoading(false);
    }
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ledigyta.se";
  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    category: categoryLabels[listing.category],
    offers: { "@type": "Offer", price: listing.price, priceCurrency: "SEK" },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Storlek", value: `${listing.size} m²` },
      { "@type": "PropertyValue", name: "Adress", value: `${listing.address}, ${listing.city}` },
    ],
    url: `${baseUrl}/annonser/${listing.id}`,
  };
  const jsonLdStr = JSON.stringify(listingJsonLd).replace(/<\/script/gi, "<\\/script").replace(/<\//g, "<\\/");

  return (
    <div className="min-h-screen bg-muted/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdStr }} />
      <ListingDetailContent
        listing={listing}
        showBackLink
        contactSlot={
          <>
            {contactError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                {contactError}
              </p>
            )}
            <div className="flex gap-2 items-center">
              <button
                onClick={handleContact}
                disabled={contactLoading}
                className="btn-glow flex-1 py-3 px-4 bg-navy text-white text-center text-sm font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {contactLoading ? "Vänta..." : "Kontakta hyresvärd"}
              </button>
              <FavoriteButton listingId={listing.id} initialFavorited={favorited} className="shrink-0 bg-white/80 text-navy rounded-xl p-2.5" />
            </div>
            <button
              type="button"
              onClick={() => downloadListingPdf(listing)}
              className="w-full py-3 px-4 border border-border/60 text-gray-600 text-center text-sm font-medium rounded-xl hover:bg-muted/50 hover:border-navy/20 hover:text-navy transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ladda ner PDF
            </button>
            <a href={`mailto:${listing.contact.email}`} className="w-full py-3 px-4 border border-navy/20 text-navy text-center text-sm font-medium rounded-xl hover:bg-navy/[0.03] transition-colors">
              Skicka e-post
            </a>
            <a href={`tel:${listing.contact.phone.replace(/\s/g, "")}`} className="w-full py-3 px-4 border border-border/60 text-gray-500 text-center text-sm font-medium rounded-xl hover:bg-muted/50 transition-colors">
              Ring
            </a>
          </>
        }
      />
    </div>
  );
}
