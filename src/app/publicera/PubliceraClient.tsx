"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PENDING_LISTING_KEY = "hy_pending_listing";

interface StoredData {
  generated: {
    title: string;
    description: string;
    tags: string[];
    city: string;
    address: string;
    lat: number;
    lng: number;
    type: "sale" | "rent";
    category: string;
    price: number;
    size: number;
    imageUrl: string;
    imageUrls?: string[];
    videoUrl?: string;
    nearby?: unknown;
    priceContext?: unknown;
    demographics?: unknown;
  };
  leadEmail: string;
  leadName: string;
}

export default function PubliceraClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const canceled = searchParams.get("canceled") === "true";

  const [listingData, setListingData] = useState<StoredData | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load stored listing data and pre-fill user info
  useEffect(() => {
    const stored = sessionStorage.getItem(PENDING_LISTING_KEY);
    if (!stored) {
      router.replace("/skapa-annons");
      return;
    }
    try {
      const data = JSON.parse(stored) as StoredData;
      setListingData(data);
      // Pre-fill from stored lead info
      if (data.leadName) setName(data.leadName);
      if (data.leadEmail) setEmail(data.leadEmail);
    } catch {
      router.replace("/skapa-annons");
    }
  }, [router]);

  // Pre-fill from session if logged in (overrides lead info)
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setName(session.user.name);
      if (session.user.email) setEmail(session.user.email);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingData) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) { setError("Namn krävs"); return; }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Ange en giltig e-postadress");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/publish-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing: listingData.generated,
          user: {
            name: trimmedName,
            email: trimmedEmail,
            phone: phone.trim() || undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Något gick fel");
        setSubmitting(false);
        return;
      }

      if (data.url) {
        sessionStorage.removeItem(PENDING_LISTING_KEY);
        window.location.href = data.url;
      } else {
        setError("Kunde inte starta betalning");
        setSubmitting(false);
      }
    } catch {
      setError("Något gick fel. Försök igen.");
      setSubmitting(false);
    }
  };

  if (!listingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back link */}
        <Link href="/skapa-annons" className="inline-flex items-center gap-1 text-[13px] text-gray-400 hover:text-navy transition-colors mb-6">
          &larr; Tillbaka
        </Link>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-navy p-6 sm:p-8 text-center">
            <h1 className="text-xl font-bold text-white mb-1">Publicera din annons</h1>
            <p className="text-[13px] text-white/60">
              Nå tusentals potentiella hyresgäster på HittaYta.se
            </p>
          </div>

          {/* Listing summary */}
          <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-start gap-4">
              {listingData.generated.imageUrl && (
                <img
                  src={listingData.generated.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-navy truncate">{listingData.generated.title}</p>
                <p className="text-[12px] text-gray-400 truncate">{listingData.generated.address}, {listingData.generated.city}</p>
              </div>
            </div>
          </div>

          {/* Price info */}
          <div className="px-6 sm:px-8 py-4 bg-navy/[0.02] border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-navy">499 kr/mån</p>
                <p className="text-[11px] text-gray-400">Ingen bindningstid. Avsluta när du vill.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Säker betalning via Stripe
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 space-y-4">
            {canceled && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-700">
                Betalningen avbröts. Du kan försöka igen.
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">{error}</div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 tracking-wide uppercase mb-1.5">
                Namn *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ditt namn"
                className="w-full px-4 py-3 bg-muted/50 rounded-xl text-[13px] border border-border/60 focus:border-navy outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 tracking-wide uppercase mb-1.5">
                E-post *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="din@email.se"
                className="w-full px-4 py-3 bg-muted/50 rounded-xl text-[13px] border border-border/60 focus:border-navy outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 tracking-wide uppercase mb-1.5">
                Telefon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="070-123 45 67"
                className="w-full px-4 py-3 bg-muted/50 rounded-xl text-[13px] border border-border/60 focus:border-navy outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide transition-all duration-200 hover:bg-navy/90 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Förbereder betalning...
                </span>
              ) : (
                "Gå till betalning"
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              Genom att fortsätta godkänner du våra{" "}
              <Link href="/villkor" className="underline hover:text-navy">villkor</Link>
              {" "}och{" "}
              <Link href="/integritetspolicy" className="underline hover:text-navy">integritetspolicy</Link>.
              {!session?.user && (
                <span className="block mt-1">
                  Ett konto skapas automatiskt med din e-postadress.
                </span>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
