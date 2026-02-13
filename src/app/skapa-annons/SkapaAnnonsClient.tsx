"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { availableTags, categoryLabels, allCategories, typeLabels } from "@/lib/types";
import type { Listing, NearbyData, PriceContext, DemographicsData } from "@/lib/types";
import { toast } from "sonner";
import { formatPriceInput, parsePriceInput } from "@/lib/formatPrice";
import ListingDetailContent from "@/components/ListingDetailContent";
import { downloadListingPdf } from "@/lib/pdf-listing";

const AddressMapModal = dynamic(() => import("@/components/AddressMapModal"), { ssr: false });
const ImageCropModal = dynamic(() => import("@/components/ImageCropModal"), { ssr: false });

const SUGGEST_DEBOUNCE_MS = 350;
const MIN_CHARS_FOR_SUGGEST = 3;

interface SuggestItem {
  display_name: string;
  lat: number;
  lon: number;
  city?: string;
}

type Step = "email" | "input" | "generating" | "preview" | "done";

interface InputForm {
  address: string;
  type: "sale" | "rent" | "";
  categories: string[];
  price: string;
  size: string;
  highlights: string;
  lat?: number;
  lng?: number;
}

interface GeneratedListing {
  title: string;
  description: string;
  tags: string[];
  city: string;
  address: string;
  lat: number;
  lng: number;
  type: "sale" | "rent";
  category: string; // comma-separated
  price: number;
  size: number;
  areaSummary?: string;
  imageUrl: string;
  nearby?: NearbyData;
  priceContext?: PriceContext | null;
  demographics?: DemographicsData | null;
}

const initialInput: InputForm = {
  address: "",
  type: "",
  categories: [],
  price: "",
  size: "",
  highlights: "",
};

export default function SkapaAnnonsClient() {
  const [step, setStep] = useState<Step>("email");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [input, setInput] = useState<InputForm>(initialInput);
  const [generated, setGenerated] = useState<GeneratedListing | null>(null);
  const [emailError, setEmailError] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedSuggestIndex, setSelectedSuggestIndex] = useState(-1);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [generationVersion, setGenerationVersion] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [draftChecked, setDraftChecked] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const addressWrapperRef = useRef<HTMLDivElement>(null);
  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const DRAFT_KEY = "skapa-annons-draft";

  const loadDraft = (): InputForm | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && "address" in parsed) return parsed as InputForm;
      return null;
    } catch {
      return null;
    }
  };

  const saveDraft = (data: InputForm) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  };

  const clearDraft = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const updateInput = (partial: Partial<InputForm>) => {
    setInput((prev) => ({ ...prev, ...partial }));
    setGenerateError("");
  };

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < MIN_CHARS_FOR_SUGGEST) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const res = await fetch(`/api/geocode/suggest?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
      setSuggestionsOpen(true);
      setSelectedSuggestIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    const q = input.address.trim();
    if (q.length < MIN_CHARS_FOR_SUGGEST) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    suggestDebounceRef.current = setTimeout(() => {
      fetchSuggestions(q);
      suggestDebounceRef.current = null;
    }, SUGGEST_DEBOUNCE_MS);
    return () => {
      if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    };
  }, [input.address, fetchSuggestions]);

  useEffect(() => {
    if (!draftChecked) {
      const draft = loadDraft();
      setDraftChecked(true);
      if (draft) setShowDraftBanner(true);
    }
  }, [draftChecked]);

  useEffect(() => {
    if (step === "input" || step === "email") {
      const t = setTimeout(() => saveDraft(input), 500);
      return () => clearTimeout(t);
    }
  }, [input, step]);

  useEffect(() => {
    if (step === "done") clearDraft();
  }, [step]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setInput(draft);
      setShowDraftBanner(false);
      setStep("input");
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftBanner(false);
  };

  const handleSelectSuggestion = (item: SuggestItem) => {
    updateInput({ address: item.display_name, lat: item.lat, lng: item.lon });
    setSuggestionsOpen(false);
    setSuggestions([]);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
      return;
    }
    if (e.key === "Enter" && selectedSuggestIndex >= 0 && suggestions[selectedSuggestIndex]) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedSuggestIndex]);
    }
  };

  const handleMapSelect = (displayName: string, lat: number, lng: number) => {
    updateInput({ address: displayName, lat, lng });
    setMapOpen(false);
  };

  const uploadImageBlob = async (blob: Blob) => {
    setImageUploading(true);
    setImageError("");
    try {
      const formData = new FormData();
      formData.append("file", blob, "cropped.jpg");
      const res = await fetch("/api/upload-public", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImageError(data.error || "Kunde inte ladda upp bilden.");
        return;
      }
      if (data.url && generated) {
        setGenerated((g) => (g ? { ...g, imageUrl: data.url } : g));
        toast.success("Bild uppladdad");
      }
    } catch {
      setImageError("Uppladdning misslyckades. Försök igen.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("Endast bilder (JPEG, PNG, GIF, WebP) stöds.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Bilden får max vara 10 MB.");
      return;
    }
    setCropFile(file);
  };

  const handleCropped = (blob: Blob) => {
    setCropFile(null);
    uploadImageBlob(blob);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const email = leadEmail.trim();
    const name = leadName.trim();
    if (!email) {
      setEmailError("Ange din e-postadress.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Ogiltig e-postadress.");
      return;
    }
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, source: "pdf-generator" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Något gick fel. Försök igen.");
        return;
      }
      setStep("input");
    } catch {
      setEmailError("Något gick fel. Försök igen.");
    }
  };

  const handleGenerate = async () => {
    if (!input.address.trim()) {
      setGenerateError("Ange adress");
      return;
    }
    if (!input.type) {
      setGenerateError("Välj typ (uthyres eller till salu)");
      return;
    }
    if (input.categories.length === 0) {
      setGenerateError("Välj minst en kategori");
      return;
    }
    const priceNum = Number(input.price);
    const sizeNum = Number(input.size);
    if (!input.price || Number.isNaN(priceNum) || priceNum <= 0) {
      setGenerateError("Ange ett giltigt pris");
      return;
    }
    if (!input.size || Number.isNaN(sizeNum) || sizeNum <= 0) {
      setGenerateError("Ange storlek (m²)");
      return;
    }

    setStep("generating");
    setGenerateError("");

    try {
      const body: Record<string, unknown> = {
        email: leadEmail.trim().toLowerCase(),
        address: input.address.trim(),
        type: input.type,
        category: input.categories[0], // primary category for AI generation
        price: priceNum,
        size: sizeNum,
        highlights: input.highlights.trim() || undefined,
      };
      if (input.lat != null && input.lng != null && !Number.isNaN(input.lat) && !Number.isNaN(input.lng)) {
        body.lat = input.lat;
        body.lng = input.lng;
      }
      const res = await fetch("/api/listings/generate-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error || "Kunde inte generera annons");
        setStep("input");
        return;
      }

      setGenerated({
        title: data.title ?? "",
        description: data.description ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        city: data.city ?? "",
        address: data.address ?? input.address.trim(),
        lat: typeof data.lat === "number" ? data.lat : 0,
        lng: typeof data.lng === "number" ? data.lng : 0,
        type: data.type ?? input.type,
        category: input.categories.join(","),
        price: data.price ?? priceNum,
        size: data.size ?? sizeNum,
        areaSummary: data.areaSummary,
        imageUrl: "",
        nearby: data.nearby,
        priceContext: data.priceContext ?? null,
        demographics: data.demographics ?? null,
      });
      setGenerationVersion(1);
      setStep("preview");
    } catch {
      setGenerateError("Något gick fel. Försök igen.");
      setStep("input");
    }
  };

  const toggleTag = (tag: string) => {
    if (!generated) return;
    setGenerated((g) => {
      if (!g) return g;
      const next = g.tags.includes(tag) ? g.tags.filter((t) => t !== tag) : [...g.tags, tag];
      return { ...g, tags: next.slice(0, 20) };
    });
  };

  const MAX_REGENERATIONS = 3;

  const handleRegenerate = async () => {
    if (!generated || generationVersion >= MAX_REGENERATIONS || regenerating) return;
    setRegenerating(true);
    setGenerateError("");
    try {
      const priceNum = parsePriceInput(input.price) || 0;
      const sizeNum = parseInt(input.size, 10) || 0;
      const body: Record<string, unknown> = {
        email: leadEmail.trim(),
        address: input.address.trim(),
        type: input.type,
        category: input.categories.join(","),
        price: priceNum,
        size: sizeNum,
        highlights: input.highlights.trim() || undefined,
      };
      if (input.lat != null && input.lng != null && !Number.isNaN(input.lat) && !Number.isNaN(input.lng)) {
        body.lat = input.lat;
        body.lng = input.lng;
      }
      const res = await fetch("/api/listings/generate-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || "Kunde inte generera ny text");
        return;
      }
      setGenerated({
        title: data.title ?? "",
        description: data.description ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        city: data.city ?? "",
        address: data.address ?? input.address.trim(),
        lat: typeof data.lat === "number" ? data.lat : 0,
        lng: typeof data.lng === "number" ? data.lng : 0,
        type: data.type ?? input.type,
        category: input.categories.join(","),
        price: data.price ?? priceNum,
        size: data.size ?? sizeNum,
        areaSummary: data.areaSummary,
        imageUrl: generated.imageUrl,
        nearby: data.nearby,
        priceContext: data.priceContext ?? null,
        demographics: data.demographics ?? null,
      });
      setGenerationVersion((v) => Math.min(v + 1, MAX_REGENERATIONS));
    } catch {
      setGenerateError("Något gick fel. Försök igen.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generated) return;
    setPdfDownloading(true);
    const previewListing = {
      id: "pdf-preview",
      showWatermark: true,
      title: generated.title,
      description: generated.description,
      city: generated.city,
      address: generated.address,
      type: generated.type,
      category: generated.category,
      price: generated.price,
      size: generated.size,
      imageUrl: generated.imageUrl,
      featured: false,
      createdAt: new Date().toISOString(),
      lat: generated.lat,
      lng: generated.lng,
      tags: generated.tags,
      contact: {
        name: leadName.trim() || "—",
        email: leadEmail.trim(),
        phone: "",
      },
      nearby: generated.nearby,
      priceContext: generated.priceContext ?? null,
      demographics: generated.demographics ?? null,
    };
    try {
      await downloadListingPdf(previewListing);
      toast.success("PDF nedladdad");
    } catch {
      toast.error("Kunde inte ladda ner PDF. Försök igen.");
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleFinish = () => {
    setStep("done");
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="mb-10">
          <Link href="/" className="text-[12px] text-gray-500 hover:text-navy transition-colors tracking-wide">
            &larr; Tillbaka till startsidan
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-navy mt-4 tracking-tight">
            Skapa gratis annons-PDF
          </h1>
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
            Fyll i uppgifterna nedan så genererar vårt AI en professionell annonstext. Ladda ner som PDF – ingen registrering krävs.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {(["email", "input", "preview", "done"] as const).map((s, i) => {
            const stepOrder = { email: 0, input: 1, generating: 1, preview: 2, done: 3 };
            const current = stepOrder[step];
            const filled = current >= i;
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${filled ? "bg-navy" : "bg-border/60"}`}
              />
            );
          })}
        </div>

        {showDraftBanner && (
          <div className="mb-6 p-4 rounded-xl bg-navy/5 border border-navy/10 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-navy/80">Du har ett sparat utkast – vill du fortsätta?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-4 py-2 text-[13px] font-medium text-white bg-navy rounded-lg hover:bg-navy/90 transition-colors"
              >
                Återställ utkast
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-navy transition-colors"
              >
                Ta bort
              </button>
            </div>
          </div>
        )}

        {/* Step: Email */}
        {step === "email" && (
          <form onSubmit={handleSubmitEmail} className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm animate-fade-in">
            <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg 1 av 4</p>
            <h2 className="text-lg font-bold text-navy mb-2">Ange din e-post</h2>
            <p className="text-[13px] text-gray-500 mb-6">Vi sparar din e-post så du kan använda verktyget. Du kan avregistrera dig när som helst.</p>
            {emailError && (
              <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {emailError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">E-post *</label>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => { setLeadEmail(e.target.value); setEmailError(""); }}
                  placeholder="namn@exempel.se"
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Namn (valfritt)</label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Ditt namn"
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
            <button type="submit" className="mt-6 w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              Fortsätt till nästa steg
            </button>
          </form>
        )}

        {/* Step: Input */}
        {step === "input" && (
          <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm animate-fade-in">
            <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg 2 av 4</p>
            <h2 className="text-lg font-bold text-navy mb-2">Grunddata om lokalen</h2>
            {generateError && (
              <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {generateError}
              </div>
            )}
            <div className="space-y-5">
              <div ref={addressWrapperRef} className="relative">
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Adress</label>
                <input
                  type="text"
                  value={input.address}
                  onChange={(e) => updateInput({ address: e.target.value })}
                  onKeyDown={handleAddressKeyDown}
                  placeholder="T.ex. Storgatan 12, Göteborg"
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestionsOpen && suggestions.length > 0}
                  aria-autocomplete="list"
                  aria-controls="skapa-address-suggestions"
                  aria-activedescendant={selectedSuggestIndex >= 0 ? `skapa-address-opt-${selectedSuggestIndex}` : undefined}
                />
                {suggestionsLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
                )}
                {suggestionsOpen && suggestions.length > 0 && (
                  <ul id="skapa-address-suggestions" role="listbox" className="absolute z-10 left-0 right-0 mt-1 py-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-[50vh] sm:max-h-56 overflow-y-auto">
                    {suggestions.map((item, i) => (
                        <li
                          key={`${item.display_name}-${i}`}
                          id={`skapa-address-opt-${i}`}
                          role="option"
                          aria-selected={i === selectedSuggestIndex}
                          className={`px-4 py-2.5 text-[13px] cursor-pointer transition-colors ${
                            i === selectedSuggestIndex ? "bg-navy/10 text-navy" : "text-gray-700 hover:bg-muted/50"
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectSuggestion(item);
                          }}
                        >
                        {item.display_name}
                        {item.city && <span className="block text-[11px] text-gray-400 mt-0.5">{item.city}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="mt-2 flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-gray-500 hover:text-navy hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Välj plats på karta
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Typ</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["rent", "sale"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateInput({ type: t })}
                        className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all border ${
                          input.type === t ? "bg-navy text-white border-navy" : "bg-white text-gray-500 border-border/60 hover:border-navy/20"
                        }`}
                      >
                        {typeLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Kategori
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((cat) => {
                      const active = input.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? input.categories.filter((c) => c !== cat)
                              : [...input.categories, cat];
                            updateInput({ categories: next });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all border ${
                            active
                              ? "bg-navy text-white border-navy"
                              : "bg-white text-gray-500 border-border/60 hover:border-navy/20 hover:text-navy"
                          }`}
                        >
                          {categoryLabels[cat]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Pris {input.type === "sale" ? "(kr)" : "(kr/mån)"}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatPriceInput(input.price)}
                    onChange={(e) => updateInput({ price: parsePriceInput(e.target.value) })}
                    placeholder={input.type === "sale" ? "3 500 000" : "25 000"}
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Storlek (m²)</label>
                  <input
                    type="number"
                    value={input.size}
                    onChange={(e) => updateInput({ size: e.target.value })}
                    placeholder="120"
                    min="0"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Det du vill lyfta (valfritt)</label>
                <textarea
                  value={input.highlights}
                  onChange={(e) => updateInput({ highlights: e.target.value })}
                  placeholder="T.ex. Nyrenoverat, skyltfönsterläge..."
                  rows={3}
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all resize-none leading-relaxed"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-6 w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              Generera annons med AI
            </button>
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <div className="bg-white rounded-2xl border border-border/60 p-12 text-center shadow-sm animate-fade-in">
            <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[15px] font-semibold text-navy mb-1">Skapar annons med AI</p>
            <p className="text-[13px] text-gray-500 max-w-xs mx-auto">
              Vi hämtar platsinformation, väder och statistik och skriver en säljande annons åt dig.
            </p>
          </div>
        )}

        {/* Step: Preview – resultat visas direkt */}
        {step === "preview" && generated && (
          <div className="animate-fade-in space-y-6">
            <div className="rounded-2xl border border-border/60 overflow-hidden bg-white shadow-sm">
              <ListingDetailContent
                listing={{
                  id: "preview",
                  title: generated.title,
                  description: generated.description,
                  city: generated.city,
                  address: generated.address,
                  type: generated.type,
                  category: generated.category,
                  price: generated.price,
                  size: generated.size,
                  imageUrl: generated.imageUrl,
                  featured: false,
                  createdAt: new Date().toISOString(),
                  lat: generated.lat,
                  lng: generated.lng,
                  tags: generated.tags,
                  contact: { name: leadName.trim() || "—", email: leadEmail.trim(), phone: "" },
                }}
                showBackLink={false}
                compact
                editableDescription
                onDescriptionChange={(desc) => setGenerated((g) => (g ? { ...g, description: desc } : g))}
                contactSlot={
                  <div className="p-6 border-t border-border/40 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={pdfDownloading}
                        className="flex-1 min-w-0 py-3.5 px-4 bg-navy text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      <button
                        type="button"
                        onClick={handleFinish}
                        className="min-w-fit shrink-0 py-3.5 px-4 border border-border/60 text-gray-600 text-[13px] font-medium rounded-xl hover:bg-muted/50 hover:border-navy/20 hover:text-navy transition-colors whitespace-nowrap"
                      >
                        Klar – nästa steg
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        disabled={generationVersion >= MAX_REGENERATIONS || regenerating}
                        className="text-gray-500 hover:text-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {regenerating ? "Genererar..." : `Generera ny text (${generationVersion}/${MAX_REGENERATIONS})`}
                      </button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageUpload(f);
                          e.target.value = "";
                        }}
                      />
                      <ImageCropModal
                        open={!!cropFile}
                        imageFile={cropFile}
                        onClose={() => setCropFile(null)}
                        onCropped={handleCropped}
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={imageUploading}
                        className="text-gray-500 hover:text-navy transition-colors disabled:opacity-50"
                      >
                        {imageUploading ? "Laddar upp..." : generated.imageUrl ? "Byt bild" : "Ladda upp bild (valfritt)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStep("input"); setGenerateError(""); }}
                        className="text-gray-400 hover:text-navy transition-colors"
                      >
                        &larr; Redigera grunddata
                      </button>
                    </div>
                    {imageError && <p className="text-[12px] text-red-600">{imageError}</p>}
                  </div>
                }
              />
            </div>

            {/* Områdesanalys – visible summary of enrichment data */}
            {(generated.demographics || generated.nearby) && (
              <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Områdesanalys</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {generated.demographics?.population && (
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Invånare</p>
                      <p className="text-base font-bold text-navy">{generated.demographics.population.toLocaleString("sv-SE")}</p>
                    </div>
                  )}
                  {generated.demographics?.medianIncome && (
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Medianinkomst</p>
                      <p className="text-base font-bold text-navy">{generated.demographics.medianIncome} tkr/år</p>
                    </div>
                  )}
                  {generated.demographics?.workingAgePercent && (
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Arbetsför ålder</p>
                      <p className="text-base font-bold text-navy">{generated.demographics.workingAgePercent}%</p>
                    </div>
                  )}
                  {generated.demographics?.totalBusinesses && (
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Företag</p>
                      <p className="text-base font-bold text-navy">{generated.demographics.totalBusinesses.toLocaleString("sv-SE")}</p>
                    </div>
                  )}
                  {generated.demographics?.crimeRate && (
                    <div className="bg-muted/40 rounded-xl p-3">
                      <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Brott/100k inv.</p>
                      <p className="text-base font-bold text-navy">{generated.demographics.crimeRate.toLocaleString("sv-SE")}</p>
                    </div>
                  )}
                </div>
                {generated.nearby && (
                  <>
                    <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Inom 2,5 km</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
                      {generated.nearby.restaurants > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.restaurants} restauranger
                        </div>
                      )}
                      {generated.nearby.shops > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.shops} butiker
                        </div>
                      )}
                      {generated.nearby.busStops.count > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.busStops.count} busshållplatser
                        </div>
                      )}
                      {generated.nearby.trainStations.count > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.trainStations.count} tågstationer
                        </div>
                      )}
                      {generated.nearby.parking > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.parking} parkeringar
                        </div>
                      )}
                      {generated.nearby.schools > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.schools} skolor
                        </div>
                      )}
                      {generated.nearby.healthcare > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.healthcare} vård/apotek
                        </div>
                      )}
                      {generated.nearby.gyms > 0 && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-2 h-2 rounded-full bg-navy/30 shrink-0" />
                          {generated.nearby.gyms} gym
                        </div>
                      )}
                    </div>
                  </>
                )}
                <p className="text-[11px] text-gray-400 mt-4">
                  Källa: SCB, BRÅ, OpenStreetMap
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Done (upsell) */}
        {step === "done" && (
          <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm animate-fade-in text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-navy/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-navy">&#10003;</span>
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Tack! Din PDF är nedladdad</h2>
            <p className="text-[13px] text-gray-500 mb-8 max-w-md mx-auto">
              Vill du publicera annonsen live på HittaYta.se och nå tusentals potentiella hyresgäster? Skapa ett konto – det tar bara en minut.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/registrera"
                className="py-3.5 px-6 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide text-center hover:bg-navy/90 transition-colors"
              >
                Registrera dig gratis
              </Link>
              <Link
                href="/"
                className="py-3.5 px-6 border border-border/60 text-gray-600 text-[13px] font-medium rounded-xl hover:bg-muted/50 transition-colors text-center"
              >
                Tillbaka till startsidan
              </Link>
            </div>
          </div>
        )}
      </div>

      <AddressMapModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialLat={input.lat}
        initialLng={input.lng}
        initialAddress={input.address.trim() || undefined}
        onSelect={handleMapSelect}
      />
    </div>
  );
}
