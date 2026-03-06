"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Step = "email" | "input" | "loading" | "result";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface DemographicsData {
  population: number;
  city: string;
  medianIncome?: number;
  workingAgePercent?: number;
  totalBusinesses?: number;
  crimeRate?: number;
}

interface NearbyData {
  restaurants: number;
  shops: number;
  gyms: number;
  busStops: { count: number; nearest?: string; nearestDistance?: number };
  trainStations: { count: number; nearest?: string; nearestDistance?: number };
  parking: number;
  schools: number;
  healthcare: number;
}

interface PriceContext {
  medianPrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

interface AreaContext {
  summary: string;
  title: string;
  url: string;
}

interface ReportResult {
  address: string;
  city: string;
  lat: number;
  lng: number;
  demographics: DemographicsData | null;
  nearby: NearbyData | null;
  areaContext: AreaContext | null;
  priceContext: { rent: PriceContext | null; sale: PriceContext | null };
  aiAnalysis: string;
}

function fmtNum(n: number) { return n.toLocaleString("sv-SE"); }

export default function OmradesrapportClient() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");

  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [result, setResult] = useState<ReportResult | null>(null);
  const [loadingError, setLoadingError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) { setSuggestions([]); setSuggestionsOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setSuggestionsOpen(true);
      } catch { setSuggestions([]); }
    }, 300);
  }, []);

  useEffect(() => { return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }; }, []);

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
        body: JSON.stringify({ email: trimmed, name: name.trim() || undefined, source: "omradesrapport" }),
      });
      setStep("input");
    } catch { setEmailError("Något gick fel. Försök igen."); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setStep("loading");
    setLoadingError("");
    try {
      const res = await fetch("/api/tools/area-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), address: address.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setLoadingError(data.error || "Något gick fel"); setStep("input"); return; }
      setResult(data);
      setStep("result");
    } catch {
      setLoadingError("Kunde inte generera rapport. Försök igen.");
      setStep("input");
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/tools/area-report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omradesrapport-${result.city.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const totalSteps = 3;
  const currentProgress = step === "email" ? 0 : step === "input" ? 1 : step === "loading" ? 2 : 3;

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-10 sm:pt-16 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-navy/40 mb-3">Gratis verktyg</p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-navy tracking-tight mb-3 sm:mb-5">Områdesrapport</h1>
          <p className="text-gray-500 text-sm sm:text-lg max-w-xl mx-auto">Få en detaljerad analys av valfritt område med demografi, köpkraft, infrastruktur och marknadspriser.</p>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-1 mb-10">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${currentProgress > i ? "bg-navy" : "bg-border/60"}`} />
            ))}
          </div>

          {/* Email step */}
          {step === "email" && (
            <form onSubmit={handleSubmitEmail} className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg 1 av {totalSteps}</p>
              <h2 className="text-lg font-bold text-navy mb-2">Ange din e-post</h2>
              <p className="text-[13px] text-gray-500 mb-6">Vi skickar din rapport till din e-post.</p>
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
              <button type="submit" className="mt-6 w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide hover:shadow-md hover:-translate-y-0.5 transition-all">Fortsätt</button>
            </form>
          )}

          {/* Input step */}
          {step === "input" && (
            <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg 2 av {totalSteps}</p>
              <h2 className="text-lg font-bold text-navy mb-2">Ange adress</h2>
              <p className="text-[13px] text-gray-500 mb-6">Skriv in adressen du vill analysera.</p>
              <div className="relative">
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Adress *</label>
                <input type="text" value={address} onChange={(e) => { setAddress(e.target.value); fetchSuggestions(e.target.value); }} onBlur={() => setTimeout(() => setSuggestionsOpen(false), 200)} placeholder="Kungsgatan 1, Stockholm" className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" required />
                {suggestionsOpen && suggestions.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <li key={i}><button type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors" onMouseDown={() => { setAddress(s.display_name); setSuggestionsOpen(false); }}>{s.display_name}</button></li>
                    ))}
                  </ul>
                )}
              </div>
              {loadingError && <p className="text-red-500 text-xs mt-3">{loadingError}</p>}
              <button type="submit" disabled={!address.trim()} className="mt-6 w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">Generera rapport</button>
            </form>
          )}

          {/* Loading */}
          {step === "loading" && (
            <div className="bg-white rounded-2xl border border-border/60 p-10 sm:p-14 shadow-sm text-center">
              <div className="w-10 h-10 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-5" />
              <p className="text-sm text-gray-500">Samlar in data och genererar din rapport...</p>
              <p className="text-xs text-gray-400 mt-2">Detta kan ta upp till 30 sekunder</p>
            </div>
          )}

          {/* Result */}
          {step === "result" && result && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white">
                <p className="text-[11px] font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Områdesrapport</p>
                <h2 className="text-xl font-bold mb-1">{result.address}</h2>
                <p className="text-sm text-white/50">{result.city}</p>
                <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="mt-5 px-6 py-3 bg-gold text-navy text-sm font-semibold rounded-full hover:brightness-105 transition-all disabled:opacity-50">
                  {downloadingPdf ? "Genererar PDF..." : "Ladda ner som PDF"}
                </button>
              </div>

              {/* AI Analysis */}
              {result.aiAnalysis && (
                <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Analys</p>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    {result.aiAnalysis.split("\n").filter(Boolean).map((line, i) => {
                      const headingMatch = line.match(/^#{1,3}\s+(.+)/);
                      if (headingMatch) return <h3 key={i} className="text-base font-bold text-navy mt-4 mb-2">{headingMatch[1]}</h3>;
                      if (/^[A-ZÅÄÖ][A-ZÅÄÖ\s&]+$/.test(line.trim())) return <h3 key={i} className="text-base font-bold text-navy mt-4 mb-2">{line}</h3>;
                      return <p key={i} className="text-sm text-gray-600 leading-relaxed mb-2">{line}</p>;
                    })}
                  </div>
                </div>
              )}

              {/* Demographics */}
              {result.demographics && (
                <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Demografi &amp; Ekonomi</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard label="Befolkning" value={fmtNum(result.demographics.population)} />
                    {result.demographics.medianIncome != null && <StatCard label="Medianinkomst" value={`${fmtNum(result.demographics.medianIncome)} tkr/år`} />}
                    {result.demographics.workingAgePercent != null && <StatCard label="Arbetsför befolkning" value={`${result.demographics.workingAgePercent}%`} />}
                    {result.demographics.totalBusinesses != null && <StatCard label="Antal företag" value={fmtNum(result.demographics.totalBusinesses)} />}
                    {result.demographics.crimeRate != null && <StatCard label="Brott/100 000 inv." value={fmtNum(result.demographics.crimeRate)} />}
                  </div>
                </div>
              )}

              {/* Nearby */}
              {result.nearby && (
                <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Infrastruktur &amp; Tillgänglighet</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <StatCard label="Restauranger" value={String(result.nearby.restaurants)} />
                    <StatCard label="Butiker" value={String(result.nearby.shops)} />
                    <StatCard label="Gym" value={String(result.nearby.gyms)} />
                    <StatCard label="Busshållplatser" value={String(result.nearby.busStops.count)} sub={result.nearby.busStops.nearest} />
                    <StatCard label="Tågstationer" value={String(result.nearby.trainStations.count)} sub={result.nearby.trainStations.nearest} />
                    <StatCard label="Parkering" value={String(result.nearby.parking)} />
                    <StatCard label="Skolor" value={String(result.nearby.schools)} />
                    <StatCard label="Sjukvård" value={String(result.nearby.healthcare)} />
                  </div>
                </div>
              )}

              {/* Price context */}
              {(result.priceContext.rent || result.priceContext.sale) && (
                <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Marknad &amp; Priser</p>
                  <div className="space-y-4">
                    {result.priceContext.rent && (
                      <div className="bg-muted/40 rounded-xl p-5">
                        <p className="text-xs font-semibold text-navy mb-3">Hyresmarknaden (kontor)</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Median</p>
                            <p className="text-base font-bold text-navy">{fmtNum(result.priceContext.rent.medianPrice)} kr/mån</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Intervall</p>
                            <p className="text-sm text-gray-600">{fmtNum(result.priceContext.rent.minPrice)} – {fmtNum(result.priceContext.rent.maxPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Objekt</p>
                            <p className="text-sm text-gray-600">{result.priceContext.rent.count}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.priceContext.sale && (
                      <div className="bg-muted/40 rounded-xl p-5">
                        <p className="text-xs font-semibold text-navy mb-3">Köpmarknaden (kontor)</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Median</p>
                            <p className="text-base font-bold text-navy">{fmtNum(result.priceContext.sale.medianPrice)} kr</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Intervall</p>
                            <p className="text-sm text-gray-600">{fmtNum(result.priceContext.sale.minPrice)} – {fmtNum(result.priceContext.sale.maxPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 mb-1">Objekt</p>
                            <p className="text-sm text-gray-600">{result.priceContext.sale.count}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Area context */}
              {result.areaContext && (
                <div className="bg-muted/40 rounded-2xl p-6 sm:p-8">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Om området</p>
                  <h3 className="text-base font-bold text-navy mb-2">{result.areaContext.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{result.areaContext.summary}</p>
                  <a href={result.areaContext.url} target="_blank" rel="noopener noreferrer" className="text-xs text-navy/60 hover:text-navy underline transition-colors">Läs mer på Wikipedia</a>
                </div>
              )}

              {/* CTA */}
              <div className="bg-navy rounded-2xl p-6 sm:p-8 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Letar du efter lokal i {result.city}?</h3>
                <p className="text-sm text-white/50 mb-5">Se alla tillgängliga lokaler i området</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href={`/annonser?city=${encodeURIComponent(result.city)}`} className="px-6 py-3 bg-gold text-navy text-sm font-semibold rounded-full hover:brightness-105 transition-all">Se lokaler i {result.city}</a>
                  <button type="button" onClick={() => { setStep("input"); setAddress(""); setResult(null); }} className="px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/20 transition-all">Ny rapport</button>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Denna rapport är genererad automatiskt baserat på offentliga datakällor (SCB, BRÅ, OpenStreetMap, Wikipedia) och tillgängliga annonser. Informationen är avsedd som vägledning och utgör inte professionell rådgivning.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <p className="text-[10px] text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-navy">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
