"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { availableTags, categoryLabels, typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";
import { formatPriceInput, parsePriceInput } from "@/lib/formatPrice";
import CustomSelect from "./CustomSelect";
import ListingDetailContent from "./ListingDetailContent";
import { downloadListingPdf } from "@/lib/pdf-listing";

const AddressMapModal = dynamic(() => import("./AddressMapModal"), { ssr: false });

const SUGGEST_DEBOUNCE_MS = 350;
const MIN_CHARS_FOR_SUGGEST = 3;

interface SuggestItem {
  display_name: string;
  lat: number;
  lon: number;
  city?: string;
}

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "input" | "generating" | "preview";

interface InputForm {
  address: string;
  type: "sale" | "rent" | "";
  category: "butik" | "kontor" | "lager" | "ovrigt" | "";
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
  category: "butik" | "kontor" | "lager" | "ovrigt";
  price: number;
  size: number;
  areaSummary?: string;
  imageUrl: string;
}

const initialInput: InputForm = {
  address: "",
  type: "",
  category: "",
  price: "",
  size: "",
  highlights: "",
};

export default function CreateListingModal({ open, onClose }: CreateListingModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [input, setInput] = useState<InputForm>(initialInput);
  const [generated, setGenerated] = useState<GeneratedListing | null>(null);
  const [publishError, setPublishError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedSuggestIndex, setSelectedSuggestIndex] = useState(-1);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const addressWrapperRef = useRef<HTMLDivElement>(null);
  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
    const handleClickOutside = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (item: SuggestItem) => {
    updateInput({
      address: item.display_name,
      lat: item.lat,
      lng: item.lon,
    });
    setSuggestionsOpen(false);
    setSuggestions([]);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (e.key === "Escape") {
      setSuggestionsOpen(false);
      return;
    }
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

  const toggleTag = (tag: string) => {
    if (!generated) return;
    setGenerated((g) => {
      if (!g) return g;
      const next = g.tags.includes(tag) ? g.tags.filter((t) => t !== tag) : [...g.tags, tag];
      return { ...g, tags: next.slice(0, 20) };
    });
  };

  const handleGenerate = async () => {
    if (!session?.user) {
      router.push("/logga-in");
      return;
    }
    if (!input.address.trim()) {
      setGenerateError("Ange adress");
      return;
    }
    if (!input.type) {
      setGenerateError("Välj typ (uthyres eller till salu)");
      return;
    }
    if (!input.category) {
      setGenerateError("Välj kategori");
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
        address: input.address.trim(),
        type: input.type,
        category: input.category,
        price: priceNum,
        size: sizeNum,
        highlights: input.highlights.trim() || undefined,
      };
      if (input.lat != null && input.lng != null && !Number.isNaN(input.lat) && !Number.isNaN(input.lng)) {
        body.lat = input.lat;
        body.lng = input.lng;
      }
      const res = await fetch("/api/listings/generate", {
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
        category: data.category ?? input.category,
        price: data.price ?? priceNum,
        size: data.size ?? sizeNum,
        areaSummary: data.areaSummary,
        imageUrl: "",
      });
      setStep("preview");
    } catch {
      setGenerateError("Något gick fel. Försök igen.");
      setStep("input");
    }
  };

  const handleBackToEdit = () => {
    setStep("input");
    setPublishError("");
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setPublishError("Endast bilder (JPEG, PNG, GIF, WebP) stöds.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPublishError("Bilden får max vara 10 MB.");
      return;
    }
    setImageUploading(true);
    setPublishError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setPublishError(data.error || "Kunde inte ladda upp bilden.");
        return;
      }
      if (data.url && generated) {
        setGenerated((g) => (g ? { ...g, imageUrl: data.url } : g));
      }
    } catch {
      setPublishError("Uppladdning misslyckades. Försök igen.");
    } finally {
      setImageUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!session?.user || !generated) return;
    if (!generated.imageUrl?.trim()) {
      setPublishError("Ladda upp en bild innan du publicerar.");
      return;
    }
    setSubmitting(true);
    setPublishError("");
    try {
      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generated.title.trim() || "Kommersiell lokal",
          description: generated.description.trim() || "",
          city: generated.city.trim(),
          address: generated.address.trim(),
          type: generated.type,
          category: generated.category,
          price: generated.price,
          size: generated.size,
          tags: generated.tags,
          imageUrl: generated.imageUrl.trim(),
          lat: generated.lat,
          lng: generated.lng,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPublishError(data.error || "Kunde inte publicera");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setInput(initialInput);
        setGenerated(null);
        setStep("input");
        setSubmitted(false);
        setSubmitting(false);
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch {
      setPublishError("Något gick fel. Försök igen.");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setInput(initialInput);
      setGenerated(null);
      setStep("input");
      setGenerateError("");
      setPublishError("");
      setSubmitted(false);
      setSubmitting(false);
    }, 300);
  };

  if (!open) return null;

  if (!session?.user) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={handleClose} />
        <div
          className="relative w-full max-w-md bg-white rounded-2xl p-10 text-center animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy/[0.03] transition-colors text-gray-400 hover:text-navy"
          >
            &times;
          </button>
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-navy/[0.04] flex items-center justify-center">
            <span className="text-2xl font-bold text-navy/40">H</span>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2 tracking-tight">Annonsera din lokal</h2>
          <p className="text-[13px] text-gray-400 mb-8 leading-relaxed max-w-xs mx-auto">
            Logga in eller skapa ett konto för att publicera din annons och nå tusentals potentiella hyresgäster.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/logga-in"
              onClick={handleClose}
              className="w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              Logga in
            </Link>
            <Link
              href="/registrera"
              onClick={handleClose}
              className="w-full py-3.5 border border-navy/20 text-navy text-[13px] font-semibold rounded-xl tracking-wide text-center hover:bg-navy/[0.03] transition-colors"
            >
              Skapa konto
            </Link>
          </div>
          <p className="text-[11px] text-gray-300 mt-6">Verifiering sker med BankID</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-white rounded-2xl p-10 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-navy/[0.04] border border-navy/10 shadow-sm flex items-center justify-center">
            <span className="text-2xl">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2 tracking-tight">Annons publicerad</h2>
          <p className="text-[13px] text-gray-400">Din annons är nu live och synlig för alla besökare.</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={handleClose} />

      <div
        ref={modalRef}
        className={`relative w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col ${step === "preview" ? "max-w-full sm:max-w-5xl" : "max-w-full sm:max-w-2xl"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-8 py-5 border-b border-border/40">
          <div>
            <h2 className="text-lg font-bold text-navy tracking-tight">Skapa annons</h2>
            <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">
              {step === "input" && "Grunddata"}
              {step === "generating" && "Skapar annons med AI..."}
              {step === "preview" && "Förhandsgranskning"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy/[0.03] transition-colors text-gray-400 hover:text-navy"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-6">
          {step === "input" && (
            <>
              {(generateError || publishError) && (
                <div
                  role="alert"
                  className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700 animate-slide-down"
                >
                  {generateError || publishError}
                </div>
              )}

              <div className="space-y-5 animate-fade-in">
                <div ref={addressWrapperRef} className="relative">
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Adress
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={input.address}
                      onChange={(e) => updateInput({ address: e.target.value })}
                      onKeyDown={handleAddressKeyDown}
                      placeholder="T.ex. Storgatan 12, Göteborg"
                      className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                      autoFocus
                      autoComplete="off"
                      aria-autocomplete="list"
                      aria-expanded={suggestionsOpen}
                    />
                    {suggestionsLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
                    )}
                  </div>
                  {suggestionsOpen && suggestions.length > 0 && (
                    <ul
                      className="absolute z-10 left-0 right-0 mt-1 py-1 bg-white border border-border/60 rounded-xl shadow-lg max-h-56 overflow-y-auto"
                      role="listbox"
                    >
                      {suggestions.map((item, i) => (
                        <li
                          key={`${item.display_name}-${i}`}
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
                          {item.city && (
                            <span className="block text-[11px] text-gray-400 mt-0.5">{item.city}</span>
                          )}
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
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                      Typ
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["rent", "sale"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateInput({ type: t })}
                          className={`py-2.5 rounded-xl text-[13px] font-semibold transition-all border ${
                            input.type === t
                              ? "bg-navy text-white border-navy"
                              : "bg-white text-gray-500 border-border/60 hover:border-navy/20"
                          }`}
                        >
                          {typeLabels[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CustomSelect
                    label="Kategori"
                    value={input.category}
                    onChange={(v) => updateInput({ category: v as InputForm["category"] })}
                    placeholder="Välj kategori"
                    options={[
                      { value: "", label: "Välj kategori" },
                      ...Object.entries(categoryLabels).map(([val, label]) => ({ value: val, label })),
                    ]}
                  />
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
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                      Storlek (m²)
                    </label>
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
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Det du vill lyfta med lokalen (valfritt)
                  </label>
                  <textarea
                    value={input.highlights}
                    onChange={(e) => updateInput({ highlights: e.target.value })}
                    placeholder="T.ex. Nyrenoverat, skyltfönsterläge, nära centralstationen..."
                    rows={3}
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>
            </>
          )}

          {step === "generating" && (
            <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
              <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin mb-6" />
              <p className="text-[15px] font-semibold text-navy mb-1">Skapar annons med AI</p>
              <p className="text-[13px] text-gray-400 text-center max-w-xs">
                Vi hämtar platsinformation, väder och statistik och skriver en säljande annons åt dig.
              </p>
            </div>
          )}

          {step === "preview" && generated && (() => {
            const previewListing: Listing = {
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
              contact: {
                name: session?.user?.name ?? "",
                email: session?.user?.email ?? "",
                phone: "",
              },
            };
            return (
              <div className="animate-fade-in">
                {publishError && (
                  <div role="alert" className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                    {publishError}
                  </div>
                )}

                <div className="mb-8 p-5 rounded-2xl border border-border/60 bg-muted/20">
                  <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Redigera innan du publicerar</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1 tracking-[0.1em] uppercase">Rubrik</label>
                      <input
                        type="text"
                        value={generated.title}
                        onChange={(e) => setGenerated((g) => (g ? { ...g, title: e.target.value } : g))}
                        className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-border/60 focus:border-navy/30 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1 tracking-[0.1em] uppercase">Beskrivning</label>
                      <textarea
                        value={generated.description}
                        onChange={(e) => setGenerated((g) => (g ? { ...g, description: e.target.value } : g))}
                        rows={5}
                        className="w-full px-4 py-2.5 bg-white rounded-xl text-sm border border-border/60 focus:border-navy/30 outline-none transition-all resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Egenskaper</label>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => {
                          const active = generated.tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all border ${
                                active ? "bg-navy text-white border-navy" : "bg-white text-gray-500 border-border/60 hover:border-navy/20 hover:text-navy"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Bild (obligatorisk)</label>
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
                      {generated.imageUrl ? (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={generated.imageUrl} alt="Förhandsgranskning" className="h-32 rounded-xl border border-border object-cover" />
                          <button
                            type="button"
                            onClick={() => setGenerated((g) => (g ? { ...g, imageUrl: "" } : g))}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-sm hover:bg-navy/90 transition-colors shadow"
                            aria-label="Ta bort bild"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={imageUploading}
                          className="py-6 px-4 border-2 border-dashed border-border rounded-xl text-sm text-gray-500 hover:border-navy hover:text-navy transition-colors disabled:opacity-50"
                        >
                          {imageUploading ? "Laddar upp..." : "Ladda upp bild (max 10 MB)"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Så här ser annonsen ut för besökare</p>
                <div className="rounded-2xl border border-border/60 overflow-hidden bg-muted/30">
                  <ListingDetailContent
                    listing={previewListing}
                    showBackLink={false}
                    compact
                    contactSlot={
                      <>
                        <p className="text-[13px] text-gray-500 py-2">Kontaktknappar visas för besökare efter publicering.</p>
                        <button
                          type="button"
                          onClick={async () => { await downloadListingPdf(previewListing); }}
                          className="w-full py-3 px-4 border border-border/60 text-gray-600 text-center text-sm font-medium rounded-xl hover:bg-muted/50 hover:border-navy/20 hover:text-navy transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Ladda ner PDF
                        </button>
                      </>
                    }
                  />
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex items-center justify-between px-4 sm:px-8 py-5 border-t border-border/40 bg-muted/30">
          <div>
            {step === "preview" && (
              <button
                type="button"
                onClick={handleBackToEdit}
                className="text-[13px] font-semibold text-gray-400 hover:text-navy transition-colors"
              >
                &larr; Redigera grunddata
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step === "input" && (
              <button
                type="button"
                onClick={handleGenerate}
                className="px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                Skapa annons med AI
              </button>
            )}

            {step === "preview" && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={submitting || !generated?.imageUrl?.trim()}
                className="px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide disabled:opacity-50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                {submitting ? "Publicerar..." : generated?.imageUrl?.trim() ? "Publicera annons" : "Ladda upp bild först"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    <AddressMapModal
      open={mapOpen}
      onClose={() => setMapOpen(false)}
      initialLat={input.lat}
      initialLng={input.lng}
      initialAddress={input.address.trim() || undefined}
      onSelect={handleMapSelect}
    />
    </>
  );
}
