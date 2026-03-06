"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { getListingImages } from "@/lib/types";

type Step = "email" | "quiz" | "loading" | "result";

const EMPLOYEE_OPTIONS = ["1–5", "6–15", "16–50", "50+"];

const REQUIREMENT_OPTIONS = [
  "Skyltfönster",
  "Parkering",
  "Nära kollektivtrafik",
  "Hög takhöjd",
  "Lastbrygga",
  "Öppen planlösning",
  "Mötesrum",
];

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface AdvisorResult {
  recommendation: string;
  suggestedCategory: string;
  matchingListings: Listing[];
  tips: string[];
}

export default function LokalradgivareClient() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");

  const [quizStep, setQuizStep] = useState(0);
  const [business, setBusiness] = useState("");
  const [budget, setBudget] = useState("");
  const [size, setSize] = useState("");
  const [employees, setEmployees] = useState("");
  const [city, setCity] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loadingError, setLoadingError] = useState("");

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
        body: JSON.stringify({ email: trimmed, name: name.trim() || undefined, source: "lokalradgivare" }),
      });
      setStep("quiz");
    } catch { setEmailError("Något gick fel. Försök igen."); }
  };

  const toggleReq = (req: string) => {
    setRequirements((prev) => prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]);
  };

  const quizSteps = [
    {
      label: "Bransch",
      subtitle: "Vilken typ av verksamhet driver du?",
      content: (
        <input type="text" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="t.ex. frisörsalong, advokatbyrå, café..." className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" />
      ),
      valid: business.trim().length > 0,
    },
    {
      label: "Budget",
      subtitle: "Vad är din ungefärliga budget per månad?",
      content: (
        <div className="relative">
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="25000" min={0} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all pr-16" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">kr/mån</span>
        </div>
      ),
      valid: true,
    },
    {
      label: "Storlek",
      subtitle: "Hur stor yta behöver du ungefär?",
      content: (
        <div className="relative">
          <input type="number" value={size} onChange={(e) => setSize(e.target.value)} placeholder="80" min={0} className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all pr-10" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">m²</span>
        </div>
      ),
      valid: true,
    },
    {
      label: "Anställda",
      subtitle: "Hur många anställda har ni?",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {EMPLOYEE_OPTIONS.map((opt) => (
            <button key={opt} type="button" onClick={() => setEmployees(opt)} className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${employees === opt ? "bg-navy text-white border-navy" : "bg-muted/50 text-gray-600 border-border/60 hover:bg-muted"}`}>
              {opt}
            </button>
          ))}
        </div>
      ),
      valid: true,
    },
    {
      label: "Stad",
      subtitle: "Var vill du ha din lokal?",
      content: (
        <div className="relative">
          <input type="text" value={city} onChange={(e) => { setCity(e.target.value); fetchSuggestions(e.target.value); }} onBlur={() => setTimeout(() => setSuggestionsOpen(false), 200)} placeholder="Stockholm, Göteborg..." className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all" />
          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
              {suggestions.map((s, i) => (
                <li key={i}><button type="button" className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors" onMouseDown={() => { setCity(s.display_name.split(",")[0]?.trim() || s.display_name); setSuggestionsOpen(false); }}>{s.display_name}</button></li>
              ))}
            </ul>
          )}
        </div>
      ),
      valid: true,
    },
    {
      label: "Krav",
      subtitle: "Vilka egenskaper är viktiga?",
      content: (
        <div className="flex flex-wrap gap-2">
          {REQUIREMENT_OPTIONS.map((req) => (
            <button key={req} type="button" onClick={() => toggleReq(req)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${requirements.includes(req) ? "bg-navy text-white border-navy" : "bg-muted/50 text-gray-600 border-border/60 hover:bg-muted"}`}>
              {req}
            </button>
          ))}
        </div>
      ),
      valid: true,
    },
  ];

  const currentQuiz = quizSteps[quizStep];
  const isLastQuiz = quizStep === quizSteps.length - 1;

  const handleSubmitQuiz = async () => {
    setStep("loading");
    setLoadingError("");
    try {
      const res = await fetch("/api/tools/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          business: business.trim(),
          budget: Number(budget) || undefined,
          size: Number(size) || undefined,
          employees: employees || undefined,
          city: city.trim() || undefined,
          requirements: requirements.length > 0 ? requirements : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setLoadingError(data.error || "Något gick fel"); setStep("quiz"); return; }
      setResult(data);
      setStep("result");
    } catch {
      setLoadingError("Kunde inte generera rekommendation. Försök igen.");
      setStep("quiz");
    }
  };

  const totalSteps = quizSteps.length + 2;
  const currentProgress = step === "email" ? 0 : step === "quiz" ? quizStep + 1 : step === "loading" ? quizSteps.length + 1 : totalSteps;

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-10 sm:pt-16 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-navy/40 mb-3">Gratis verktyg</p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-navy tracking-tight mb-3 sm:mb-5">Hitta rätt lokal</h1>
          <p className="text-gray-500 text-sm sm:text-lg max-w-xl mx-auto">Svara på några frågor om din verksamhet och få personliga rekommendationer.</p>
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
              <p className="text-[13px] text-gray-500 mb-6">Vi skickar dina rekommendationer till din e-post.</p>
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

          {/* Quiz steps */}
          {step === "quiz" && currentQuiz && (
            <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg {quizStep + 2} av {totalSteps}</p>
              <h2 className="text-lg font-bold text-navy mb-1">{currentQuiz.label}</h2>
              <p className="text-[13px] text-gray-500 mb-6">{currentQuiz.subtitle}</p>
              {currentQuiz.content}
              {loadingError && <p className="text-red-500 text-xs mt-3">{loadingError}</p>}
              <div className="flex gap-3 mt-6">
                {quizStep > 0 && (
                  <button type="button" onClick={() => setQuizStep((s) => s - 1)} className="flex-1 py-3.5 bg-muted text-navy text-[13px] font-semibold rounded-xl hover:bg-muted-dark transition-all">Tillbaka</button>
                )}
                {isLastQuiz ? (
                  <button type="button" onClick={handleSubmitQuiz} disabled={!currentQuiz.valid} className="flex-1 py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">Få rekommendation</button>
                ) : (
                  <button type="button" onClick={() => setQuizStep((s) => s + 1)} disabled={!currentQuiz.valid} className="flex-1 py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">Nästa</button>
                )}
              </div>
            </div>
          )}

          {/* Loading */}
          {step === "loading" && (
            <div className="bg-white rounded-2xl border border-border/60 p-10 sm:p-14 shadow-sm text-center">
              <div className="w-10 h-10 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-5" />
              <p className="text-sm text-gray-500">Analyserar dina behov...</p>
            </div>
          )}

          {/* Result */}
          {step === "result" && result && (
            <div className="space-y-6">
              {/* AI recommendation */}
              <div className="bg-navy rounded-2xl p-6 sm:p-8 text-white">
                <p className="text-[11px] font-semibold text-white/40 tracking-[0.15em] uppercase mb-3">Din personliga rekommendation</p>
                {result.recommendation.split("\n\n").map((p, i) => (
                  <p key={i} className="text-sm text-white/80 leading-relaxed mb-3 last:mb-0">{p}</p>
                ))}
              </div>

              {/* Tips */}
              {result.tips.length > 0 && (
                <div className="bg-muted/40 rounded-2xl p-6 sm:p-8">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Praktiska tips</p>
                  <ul className="space-y-3">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-sm text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Matching listings */}
              {result.matchingListings.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Matchande lokaler</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.matchingListings.map((listing) => {
                      const images = getListingImages(listing);
                      return (
                        <Link key={listing.id} href={`/annonser/${listing.id}`} className="bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                          <div className="relative h-36 bg-muted">
                            {images[0] ? (
                              <Image src={images[0]} alt={listing.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-semibold text-navy line-clamp-1">{listing.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{listing.city} &middot; {listing.size} m²</p>
                            <p className="text-sm font-bold text-navy mt-2">{listing.price.toLocaleString("sv-SE")} kr/mån</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-navy rounded-2xl p-6 sm:p-8 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Vill du se fler lokaler?</h3>
                <p className="text-sm text-white/50 mb-5">Utforska alla tillgängliga lokaler på HittaYta.se</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/annonser" className="px-6 py-3 bg-gold text-navy text-sm font-semibold rounded-full hover:brightness-105 transition-all">Se alla annonser</Link>
                  <button type="button" onClick={() => { setStep("quiz"); setQuizStep(0); setResult(null); }} className="px-6 py-3 bg-white/10 text-white text-sm font-semibold rounded-full hover:bg-white/20 transition-all">Ny sökning</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
