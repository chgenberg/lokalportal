"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { NearbyData, DemographicsData, PriceContext, AreaContext } from "@/lib/types";

type Step = "email" | "input" | "loading" | "result";

const CATEGORIES = [
  { value: "villa", label: "Villa" },
  { value: "lägenhet", label: "Lägenhet" },
  { value: "fritidshus", label: "Fritidshus" },
  { value: "tomt", label: "Tomt" },
  { value: "radhus", label: "Radhus" },
  { value: "ovrigt", label: "Övrigt" },
];

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface EstimateResult {
  estimatedRent: number;
  estimatedPerSqm: number;
  comparables: { count: number; median: number; min: number; max: number };
  demographics: DemographicsData | null;
  nearby: NearbyData | null;
  areaContext: AreaContext | null;
  priceContext: PriceContext | null;
  aiSummary: string;
  city: string;
}

function fmtNum(n: number) {
  return n.toLocaleString("sv-SE");
}

export default function HyreskalkylatorClient() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");

  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("lägenhet");
  const [size, setSize] = useState("");
  const [inputError, setInputError] = useState("");

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loadingError, setLoadingError] = useState("");

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setSuggestionsOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Ange en giltig e-postadress.");
      return;
    }
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, name: name.trim() || undefined, source: "hyreskalkylator" }),
      });
      setStep("input");
    } catch {
      setEmailError("Något gick fel. Försök igen.");
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError("");
    if (!address.trim()) { setInputError("Ange en adress."); return; }
    if (!size || Number(size) < 1) { setInputError("Ange en giltig storlek."); return; }

    setStep("loading");
    setLoadingError("");

    try {
      const res = await fetch("/api/tools/rent-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), address: address.trim(), category, size: Number(size) }),
      });
      const data = await res.json();
      if (!res.ok) { setLoadingError(data.error || "Något gick fel"); setStep("input"); return; }
      setResult(data);
      setStep("result");
    } catch {
      setLoadingError("Kunde inte beräkna. Försök igen.");
      setStep("input");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-10 sm:pt-16 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-navy/40 mb-3">
            Gratis verktyg
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-navy tracking-tight mb-3 sm:mb-5">
            Prisuppskattning
          </h1>
          <p className="text-gray-500 text-sm sm:text-lg max-w-xl mx-auto">
            Få en uppskattning av marknadsmässigt pris baserat på adress, kategori och storlek.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-10">
            {(["email", "input", "result"] as const).map((s, i) => {
              const order: Record<Step, number> = { email: 0, input: 1, loading: 1, result: 2 };
              return (
                <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${order[step] >= i ? "bg-navy" : "bg-border/60"}`} />
              );
            })}
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSubmitEmail} className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg 1 av 3</p>
              <h2 className="text-lg font-bold text-navy mb-2">Ange din e-post</h2>
              <p className="text-[13px] text-gray-500 mb-6">Vi skickar resultatet till din e-post och sparar den för framtida tips.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">E-post *</label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(""); }} placeholder="namn@exempel.se" className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Namn (valfritt)</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ditt namn" className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" />
                </div>
              </div>
              {emailError && <p className="text-red-500 text-xs mt-3">{emailError}</p>}
              <button type="submit" className="mt-6 w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide hover:shadow-md hover:-translate-y-0.5 transition-all">
                Fortsätt
              </button>
            </form>
          )}

          {/* Step 2: Input */}
          {step === "input" && (
            <form onSubmit={handleCalculate} className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg 2 av 3</p>
              <h2 className="text-lg font-bold text-navy mb-2">Beskriv bostaden</h2>
              <p className="text-[13px] text-gray-500 mb-6">Ange adress, kategori och storlek för att få en prisuppskattning.</p>
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Adress *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); fetchSuggestions(e.target.value); }}
                    onBlur={() => setTimeout(() => setSuggestionsOpen(false), 200)}
                    placeholder="Storgatan 1, Stockholm"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                    required
                  />
                  {suggestionsOpen && suggestions.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                            onMouseDown={() => { setAddress(s.display_name); setSuggestionsOpen(false); }}
                          >
                            {s.display_name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Kategori *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Storlek (m²) *</label>
                  <input type="number" value={size} onChange={(e) => setSize(e.target.value)} placeholder="120" min={1} max={100000} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" required />
                </div>
              </div>
              {(inputError || loadingError) && <p className="text-red-500 text-xs mt-3">{inputError || loadingError}</p>}
              <button type="submit" className="mt-6 w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide hover:shadow-md hover:-translate-y-0.5 transition-all">
                Beräkna pris
              </button>
            </form>
          )}

          {/* Loading */}
          {step === "loading" && (
            <div className="bg-white rounded-2xl border border-border/60 p-10 sm:p-14 shadow-sm text-center">
              <div className="w-10 h-10 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-5" />
              <p className="text-sm text-gray-500">Analyserar marknaden...</p>
            </div>
          )}

          {/* Step 3: Result */}
          {step === "result" && result && (
            <div className="space-y-6">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase">Steg 3 av 3 – Resultat</p>

              {/* Main estimate */}
              <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white">
                <p className="text-[11px] font-semibold text-white/40 tracking-[0.15em] uppercase mb-2">Uppskattat pris</p>
                {result.estimatedRent > 0 ? (
                  <>
                    <p className="text-3xl sm:text-4xl font-bold">{fmtNum(result.estimatedRent)} <span className="text-lg font-normal text-white/60">kr</span></p>
                    <p className="text-sm text-white/50 mt-1">{fmtNum(result.estimatedPerSqm)} kr/m²</p>
                  </>
                ) : (
                  <p className="text-lg text-white/60">Inga jämförbara objekt hittades i {result.city}.</p>
                )}
                <p className="text-xs text-white/30 mt-3">Baserat på {result.comparables.count} liknande bostäder i {result.city}</p>
              </div>

              {/* AI Summary */}
              {result.aiSummary && (
                <div className="bg-muted/40 rounded-2xl p-6 sm:p-8">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Marknadsanalys</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.aiSummary}</p>
                </div>
              )}

              {/* Price comparison bars */}
              {result.estimatedRent > 0 && (
                <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Prisjämförelse</p>
                  <div className="space-y-3">
                    {[
                      { label: "Din uppskattning", value: result.estimatedRent, color: "bg-gold" },
                      { label: "Medianpris", value: result.comparables.median, color: "bg-navy" },
                      { label: "Lägsta", value: result.comparables.min, color: "bg-gray-300" },
                      { label: "Högsta", value: result.comparables.max, color: "bg-gray-300" },
                    ].filter((b) => b.value > 0).map((bar) => {
                      const maxVal = Math.max(result.estimatedRent, result.comparables.max) * 1.15;
                      const pct = Math.min((bar.value / maxVal) * 100, 100);
                      return (
                        <div key={bar.label} className="flex items-center gap-3">
                          <span className="w-28 text-xs text-gray-500 text-right shrink-0">{bar.label}</span>
                          <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden">
                            <div className={`h-full ${bar.color} rounded-lg flex items-center justify-end pr-2 transition-all`} style={{ width: `${pct}%`, minWidth: 60 }}>
                              <span className="text-[11px] font-semibold text-white whitespace-nowrap">{fmtNum(bar.value)} kr</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Demographics */}
              {result.demographics && (
                <div className="bg-white rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Områdesstatistik – {result.demographics.city}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { value: fmtNum(result.demographics.population), label: "Invånare" },
                      ...(result.demographics.medianIncome ? [{ value: `${fmtNum(result.demographics.medianIncome)} tkr`, label: "Medianinkomst/år" }] : []),
                      ...(result.demographics.workingAgePercent ? [{ value: `${result.demographics.workingAgePercent}%`, label: "Arbetsför ålder" }] : []),
                      ...(result.demographics.totalBusinesses ? [{ value: fmtNum(result.demographics.totalBusinesses), label: "Företag" }] : []),
                    ].map((card, i) => (
                      <div key={i} className="bg-muted/40 rounded-xl p-4 text-center">
                        <p className="text-xl font-bold text-navy">{card.value}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{card.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Area context */}
              {result.areaContext && (
                <div className="bg-muted/40 rounded-2xl p-6 sm:p-8">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Om området – {result.areaContext.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.areaContext.summary}</p>
                </div>
              )}

              {/* CTA */}
              <div className="bg-navy rounded-2xl p-6 sm:p-8 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Letar du efter en bostad?</h3>
                <p className="text-sm text-white/50 mb-5">Se alla tillgängliga bostäder i {result.city} på Offmarket.nu</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href={`/annonser?city=${encodeURIComponent(result.city)}`} className="px-6 py-3 bg-gold text-navy text-sm font-semibold rounded-full hover:brightness-105 transition-all">
                    Se annonser i {result.city}
                  </Link>
                  <button type="button" onClick={() => { setStep("input"); setResult(null); }} className="px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/20 transition-all">
                    Ny beräkning
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
