"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCategories } from "@/lib/types";
import type { Listing, DemographicsData, NearbyData, PriceContext, AreaContext } from "@/lib/types";
import FavoriteButton from "@/components/FavoriteButton";
import ListingDetailContent from "@/components/ListingDetailContent";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import { downloadListingPdf } from "@/lib/pdf-listing";
import { toast } from "sonner";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params.id as string;
  const [listing, setListing] = useState<(Listing & { isPremiumContent?: boolean; matchCount?: number }) | null>(null);
  const [areaData, setAreaData] = useState<{ demographics: DemographicsData | null; nearby: NearbyData; priceContext: PriceContext | null; areaContext?: AreaContext | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Budget gate state
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetStatus, setBudgetStatus] = useState<"idle" | "loading" | "matched" | "not_matched" | "error">("idle");
  const [budgetMessage, setBudgetMessage] = useState("");

  // Viewing booking state
  const [viewingOpen, setViewingOpen] = useState(false);
  const [viewingType, setViewingType] = useState<"digital" | "physical">("physical");
  const [viewingDate, setViewingDate] = useState("");
  const [viewingNotes, setViewingNotes] = useState("");
  const [viewingLoading, setViewingLoading] = useState(false);
  const [viewingSuccess, setViewingSuccess] = useState(false);

  // Premium upgrade loading
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) { setError(res.status === 404 ? "Annonsen hittades inte." : "Kunde inte ladda annonsen."); setListing(null); setLoading(false); return; }
        const data = await res.json();
        setListing(data);
        const ad = data.areaData;
        if (ad && (ad.nearby || ad.priceContext || ad.demographics)) {
          setAreaData({ demographics: ad.demographics ?? null, nearby: ad.nearby ?? { restaurants: 0, shops: 0, gyms: 0, busStops: { count: 0 }, trainStations: { count: 0 }, parking: 0, schools: 0, healthcare: 0 }, priceContext: ad.priceContext ?? null, areaContext: ad.areaContext ?? null });
        } else {
          const areaRes = await fetch(`/api/listings/${id}/area`);
          if (areaRes.ok) {
            const areaJson = await areaRes.json();
            setAreaData({ demographics: areaJson.demographics ?? null, nearby: areaJson.nearby ?? { restaurants: 0, shops: 0, gyms: 0, busStops: { count: 0 }, trainStations: { count: 0 }, parking: 0, schools: 0, healthcare: 0 }, priceContext: areaJson.priceContext ?? null, areaContext: areaJson.areaContext ?? null });
          }
        }
      } catch { setError("Ett fel uppstod."); setListing(null); } finally { setLoading(false); }
    };
    run();
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

  const handleBudgetSubmit = async () => {
    if (!budgetAmount || !listing) return;
    const amount = parseInt(budgetAmount.replace(/\s/g, ""), 10);
    if (isNaN(amount) || amount <= 0) { setBudgetMessage("Ange ett giltigt belopp"); setBudgetStatus("error"); return; }
    setBudgetStatus("loading");
    try {
      const res = await fetch("/api/budget-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, amount }),
      });
      const data = await res.json();
      if (res.ok && data.matched) {
        setBudgetStatus("matched");
        setBudgetMessage("Din budget matchar! Du kan nu kontakta säljaren.");
      } else if (res.ok && !data.matched) {
        setBudgetStatus("not_matched");
        setBudgetMessage("Din budget matchar inte säljarens pris. Justera beloppet och försök igen.");
      } else {
        setBudgetStatus("error");
        setBudgetMessage(data.error || "Kunde inte kontrollera budget.");
      }
    } catch {
      setBudgetStatus("error");
      setBudgetMessage("Något gick fel. Försök igen.");
    }
  };

  const handleContact = async () => {
    setContactError(null);
    try {
      const res = await fetch("/api/auth/session");
      const sessionData = await res.json();
      if (!sessionData?.user) { router.push(`/logga-in?callback=/annonser/${id}`); return; }
      setContactLoading(true);
      const convRes = await fetch("/api/messages/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: id }) });
      if (convRes.ok) {
        const conv = await convRes.json();
        router.push(`/dashboard/meddelanden?conv=${conv.id}`);
        return;
      }
      const data = await convRes.json().catch(() => ({}));
      const message = data?.error ?? "Kunde inte starta konversation.";
      if (data?.requiresBudget) {
        setContactError("Du måste ange en budget som matchar säljarens pris innan du kan ta kontakt.");
      } else {
        setContactError(message);
      }
    } catch {
      setContactError("Något gick fel. Försök igen eller logga in.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleBookViewing = async () => {
    if (!viewingDate) { toast.error("Välj datum och tid"); return; }
    setViewingLoading(true);
    try {
      const res = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, type: viewingType, proposedTime: new Date(viewingDate).toISOString(), notes: viewingNotes || undefined }),
      });
      if (res.ok) {
        setViewingSuccess(true);
        toast.success("Visning bokad!");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Kunde inte boka visning");
      }
    } catch {
      toast.error("Något gick fel");
    } finally {
      setViewingLoading(false);
    }
  };

  const handlePremiumUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/premium-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Kunde inte starta betalning");
      }
    } catch {
      toast.error("Något gick fel");
    } finally {
      setUpgradeLoading(false);
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
          <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 md:p-12 text-center shadow-lg shadow-navy/[0.04]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-navy/[0.04] flex items-center justify-center">
              <span className="text-xl font-bold text-navy/30">!</span>
            </div>
            <p className="text-gray-500 mb-6">{error ?? "Annonsen hittades inte."}</p>
            <Link href="/annonser" className="inline-block px-6 py-2.5 bg-navy text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              &larr; Alla annonser
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://offmarket.nu";
  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description,
    url: `${baseUrl}/annonser/${listing.id}`,
    datePosted: listing.createdAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
    },
    offers: { "@type": "Offer", price: listing.price, priceCurrency: "SEK" },
    floorSize: {
      "@type": "QuantitativeValue",
      value: listing.size,
      unitCode: "MTK",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Kategori", value: formatCategories(listing.category) },
    ],
  };
  const jsonLdStr = JSON.stringify(listingJsonLd).replace(/<\/script/gi, "<\\/script").replace(/<\//g, "<\\/");


  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <ScrollProgressBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdStr }} />
      <ListingDetailContent
        listing={listing}
        showBackLink
        areaData={areaData ?? undefined}
        contactSlot={
          <>
            {/* Premium content gate */}
            {listing.isPremiumContent && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl mb-2">
                <p className="text-sm font-semibold text-amber-800 mb-1">Premium-innehåll</p>
                <p className="text-xs text-amber-700 mb-3">Uppgradera till Premium för att se fullständig information, alla bilder och kontaktuppgifter.</p>
                <button
                  type="button"
                  onClick={handlePremiumUpgrade}
                  disabled={upgradeLoading}
                  className="w-full py-2.5 px-4 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60"
                >
                  {upgradeLoading ? "Laddar..." : "Uppgradera till Premium"}
                </button>
              </div>
            )}

            {/* Budget gate */}
            {listing.acceptancePrice && listing.ownerId !== session?.user?.id && budgetStatus !== "matched" && (
              <div className="p-4 bg-navy/[0.03] border border-border/40 rounded-xl mb-2">
                <p className="text-sm font-semibold text-navy mb-1">Budgetkontroll</p>
                <p className="text-xs text-gray-500 mb-3">Ange din budget för att verifiera att den matchar säljarens förväntningar innan kontakt.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={budgetAmount}
                    onChange={(e) => { setBudgetAmount(e.target.value.replace(/[^\d\s]/g, "")); setBudgetStatus("idle"); setBudgetMessage(""); }}
                    placeholder="T.ex. 3 500 000"
                    className="flex-1 px-3 py-2.5 bg-white rounded-lg text-sm border border-border focus:border-navy outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBudgetSubmit}
                    disabled={budgetStatus === "loading"}
                    className="px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-60 shrink-0"
                  >
                    {budgetStatus === "loading" ? "..." : "Kontrollera"}
                  </button>
                </div>
                {budgetMessage && (
                  <p className={`text-xs mt-2 ${budgetStatus === "not_matched" ? "text-amber-600" : budgetStatus === "error" ? "text-red-600" : "text-green-600"}`}>
                    {budgetMessage}
                  </p>
                )}
              </div>
            )}

            {budgetStatus === "matched" && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-sm text-green-700 font-medium">Din budget matchar! Du kan nu kontakta säljaren.</p>
              </div>
            )}

            {contactError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
                {contactError}
              </p>
            )}
            <div className="flex gap-2 items-center">
              <button
                onClick={handleContact}
                disabled={contactLoading || (!!listing.acceptancePrice && listing.ownerId !== session?.user?.id && budgetStatus !== "matched")}
                className="flex-1 py-3 px-4 bg-navy text-white text-center text-sm font-semibold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                {contactLoading ? "Vänta..." : "Kontakta säljare"}
              </button>
              <FavoriteButton listingId={listing.id} initialFavorited={favorited} className="shrink-0 bg-white/80 text-navy rounded-xl p-2.5" />
            </div>

            {/* Viewing booking */}
            {listing.ownerId !== session?.user?.id && (
              <div>
                {!viewingOpen && !viewingSuccess && (
                  <button
                    type="button"
                    onClick={() => setViewingOpen(true)}
                    className="w-full py-3 px-4 border border-navy/20 text-navy text-center text-sm font-medium rounded-xl hover:bg-navy/[0.03] transition-colors"
                  >
                    Boka visning
                  </button>
                )}
                {viewingOpen && !viewingSuccess && (
                  <div className="p-4 bg-muted/30 border border-border/40 rounded-xl space-y-3">
                    <p className="text-sm font-semibold text-navy">Boka visning</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setViewingType("physical")} className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${viewingType === "physical" ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-border hover:border-navy/20"}`}>Fysisk visning</button>
                      <button type="button" onClick={() => setViewingType("digital")} className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${viewingType === "digital" ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-border hover:border-navy/20"}`}>Digital visning</button>
                    </div>
                    <input type="datetime-local" value={viewingDate} onChange={(e) => setViewingDate(e.target.value)} className="w-full px-3 py-2.5 bg-white rounded-lg text-sm border border-border focus:border-navy outline-none" />
                    <textarea value={viewingNotes} onChange={(e) => setViewingNotes(e.target.value)} placeholder="Meddelande till säljaren (valfritt)" rows={2} className="w-full px-3 py-2.5 bg-white rounded-lg text-sm border border-border focus:border-navy outline-none resize-none" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setViewingOpen(false)} className="flex-1 py-2.5 border border-border text-gray-600 text-sm rounded-lg hover:bg-muted/50 transition-colors">Avbryt</button>
                      <button type="button" onClick={handleBookViewing} disabled={viewingLoading} className="flex-1 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-60">{viewingLoading ? "Bokar..." : "Boka"}</button>
                    </div>
                  </div>
                )}
                {viewingSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <p className="text-sm font-medium text-green-700">Visning bokad! Säljaren har fått en notifiering.</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                setPdfDownloading(true);
                try {
                  await downloadListingPdf({
                    ...listing,
                    nearby: areaData?.nearby,
                    priceContext: areaData?.priceContext,
                    demographics: areaData?.demographics,
                    areaContext: areaData?.areaContext,
                  });
                  toast.success("PDF nedladdad");
                } catch {
                  toast.error("Kunde inte ladda ner PDF. Försök igen.");
                } finally {
                  setPdfDownloading(false);
                }
              }}
              disabled={pdfDownloading}
              className="w-full py-3 px-4 border border-border/60 text-gray-600 text-center text-sm font-medium rounded-xl hover:bg-muted/50 hover:border-navy/20 hover:text-navy transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pdfDownloading ? (
                <span className="animate-pulse">Laddar ner...</span>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ladda ner PDF
                </>
              )}
            </button>
            {!listing.isPremiumContent && listing.contact?.email && (
              <a href={`mailto:${listing.contact.email}`} className="w-full py-3 px-4 border border-navy/20 text-navy text-center text-sm font-medium rounded-xl hover:bg-navy/[0.03] transition-colors">
                Skicka e-post
              </a>
            )}
            {!listing.isPremiumContent && listing.contact?.phone ? (
              <a href={`tel:${listing.contact.phone.replace(/\s/g, "")}`} className="w-full py-3 px-4 border border-border/60 text-gray-500 text-center text-sm font-medium rounded-xl hover:bg-muted/50 transition-colors">
                Ring
              </a>
            ) : null}
          </>
        }
      />

    </div>
  );
}
