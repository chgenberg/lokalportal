"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import { categoryLabels, allCategories, typeLabels } from "@/lib/types";
import type { NearbyData, PriceContext, DemographicsData } from "@/lib/types";
import { toast } from "sonner";
import { formatPriceInput, parsePriceInput } from "@/lib/formatPrice";
import ListingDetailContent from "@/components/ListingDetailContent";
import { downloadListingPdf } from "@/lib/pdf-listing";
import GeneratingProgressBar from "@/components/GeneratingProgressBar";

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

const PENDING_LISTING_KEY = "hy_pending_listing";

interface InputForm {
  address: string;
  type: "sale" | "rent" | "";
  categories: string[];
  price: string;
  size: string;
  highlights: string;
  lat?: number;
  lng?: number;
  outdoorImageUrl: string;
  indoorImageUrl: string;
  floorPlanImageUrl: string;
  extraImageUrls: string[];
  videoUrl: string;
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
  imageUrls?: string[];
  videoUrl?: string;
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
  outdoorImageUrl: "",
  indoorImageUrl: "",
  floorPlanImageUrl: "",
  extraImageUrls: [],
  videoUrl: "",
};

export default function SkapaAnnonsClient() {
  const router = useRouter();
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
  const cropSlotRef = useRef<"outdoor" | "indoor" | "floorPlan" | "extra" | null>(null);
  const [generationVersion, setGenerationVersion] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const addressWrapperRef = useRef<HTMLDivElement>(null);
  const suggestDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // (Auto-publish logic moved to /publicera page)

  // ── Publish handler — redirect to /publicera checkout page ──
  const handlePublish = () => {
    if (!generated) return;

    sessionStorage.setItem(PENDING_LISTING_KEY, JSON.stringify({
      generated,
      leadEmail,
      leadName,
      input,
    }));

    router.push("/publicera");
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
    const handleClickOutside = (e: MouseEvent) => {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


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

  const uploadImageBlob = async (
    blob: Blob,
    onSuccess?: (url: string) => void
  ) => {
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
      if (data.url) {
        if (onSuccess) {
          onSuccess(data.url);
        } else if (generated) {
          const current = generated.imageUrls?.length ? generated.imageUrls : (generated.imageUrl ? [generated.imageUrl] : []);
          const next = [...current, data.url];
          setGenerated((g) => (g ? { ...g, imageUrl: next[0] || "", imageUrls: next } : g));
        }
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
    const slot = cropSlotRef.current;
    cropSlotRef.current = null;
    setCropFile(null);

    if (slot === "outdoor") {
      uploadImageBlob(blob, (url) => updateInput({ outdoorImageUrl: url }));
    } else if (slot === "indoor") {
      uploadImageBlob(blob, (url) => updateInput({ indoorImageUrl: url }));
    } else if (slot === "floorPlan") {
      uploadImageBlob(blob, (url) => updateInput({ floorPlanImageUrl: url }));
    } else if (slot === "extra") {
      uploadImageBlob(blob, (url) =>
        setInput((prev) => ({
          ...prev,
          extraImageUrls: [...(prev.extraImageUrls || []), url],
        }))
      );
    } else {
      uploadImageBlob(blob);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setImageError("Endast video (MP4, WebM) stöds.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setImageError("Videon får max vara 50 MB.");
      return;
    }
    setImageUploading(true);
    setImageError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-public", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImageError(data.error || "Kunde inte ladda upp videon.");
        return;
      }
      if (data.url) {
        updateInput({ videoUrl: data.url });
        toast.success("Video uppladdad");
      }
    } catch {
      setImageError("Kunde inte ladda upp videon.");
    } finally {
      setImageUploading(false);
    }
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
    if (!input.outdoorImageUrl?.trim()) {
      setGenerateError("Ladda upp minst en bild av fasaden/utsidan");
      return;
    }
    if (!input.indoorImageUrl?.trim()) {
      setGenerateError("Ladda upp minst en bild av insidan");
      return;
    }

    setStep("generating");
    setAiDone(false);
    setGenerateError("");

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const toFullUrl = (u: string) => (u.startsWith("/") ? `${baseUrl}${u}` : u);
      const imageUrls = [
        toFullUrl(input.outdoorImageUrl),
        toFullUrl(input.indoorImageUrl),
        ...(input.floorPlanImageUrl ? [toFullUrl(input.floorPlanImageUrl)] : []),
        ...(input.extraImageUrls || []).map(toFullUrl),
      ];
      const body: Record<string, unknown> = {
        email: leadEmail.trim().toLowerCase(),
        address: input.address.trim(),
        type: input.type,
        category: input.categories[0],
        price: priceNum,
        size: sizeNum,
        highlights: input.highlights.trim() || undefined,
        imageUrls,
        floorPlanImageUrl: input.floorPlanImageUrl ? toFullUrl(input.floorPlanImageUrl) : undefined,
        videoUrl: input.videoUrl ? toFullUrl(input.videoUrl) : undefined,
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
        imageUrl: input.outdoorImageUrl || input.indoorImageUrl || "",
        imageUrls: [
          input.outdoorImageUrl,
          input.indoorImageUrl,
          ...(input.floorPlanImageUrl ? [input.floorPlanImageUrl] : []),
          ...(input.extraImageUrls || []),
        ].filter(Boolean),
        videoUrl: input.videoUrl || undefined,
        nearby: data.nearby,
        priceContext: data.priceContext ?? null,
        demographics: data.demographics ?? null,
      });
      setGenerationVersion(1);
      setAiDone(true); // Progress bar will transition to preview
    } catch {
      setGenerateError("Något gick fel. Försök igen.");
      setAiDone(false);
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
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const toFullUrl = (u: string) => (u.startsWith("/") ? `${baseUrl}${u}` : u);
      const imageUrls = [
        toFullUrl(input.outdoorImageUrl),
        toFullUrl(input.indoorImageUrl),
        ...(input.floorPlanImageUrl ? [toFullUrl(input.floorPlanImageUrl)] : []),
        ...(input.extraImageUrls || []).map(toFullUrl),
      ].filter(Boolean);
      const body: Record<string, unknown> = {
        email: leadEmail.trim(),
        address: input.address.trim(),
        type: input.type,
        category: input.categories.join(","),
        price: priceNum,
        size: sizeNum,
        highlights: input.highlights.trim() || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
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
        imageUrls: generated.imageUrls,
        videoUrl: generated.videoUrl,
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
      imageUrls: generated.imageUrls,
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

  // handleFinish removed — publish flow replaces it

  return (
    <div className="min-h-screen bg-muted/30">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && f.type.startsWith("image/")) {
            if (step === "input" && cropSlotRef.current) {
              handleImageUpload(f);
            } else {
              cropSlotRef.current = null;
              handleImageUpload(f);
            }
          }
          e.target.value = "";
        }}
      />
      <ImageCropModal
        open={!!cropFile}
        imageFile={cropFile}
        onClose={() => { setCropFile(null); cropSlotRef.current = null; }}
        onCropped={handleCropped}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="mb-10">
          <Link href="/" className="text-[12px] text-gray-500 hover:text-navy transition-colors tracking-wide">
            &larr; Tillbaka till startsidan
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-navy mt-4 tracking-tight">
            Skapa annons
          </h1>
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
            Fyll i uppgifterna nedan så genererar vår agent en professionell annonstext. Ladda ner som PDF eller publicera direkt på HittaYta.se.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {(["email", "input", "preview", "publish"] as const).map((s, i) => {
            const stepOrder: Record<Step, number> = { email: 0, input: 1, generating: 1, preview: 2, done: 3 };
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


        {/* Step: Email */}
        {step === "email" && (
          <form onSubmit={handleSubmitEmail} className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm animate-fade-in">
            <p className="text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase mb-4">Steg 1 av 3</p>
            <h2 className="text-lg font-bold text-navy mb-2">Ange din e-post</h2>
            <p className="text-[13px] text-gray-500 mb-6">Vi sparar din e-post så att vi kan kontakta dig. Du kan avregistrera dig när som helst.</p>
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

              <div className="space-y-4">
                <label className="block text-[11px] font-semibold text-gray-400 tracking-[0.1em] uppercase">Bilder *</label>
                <p className="text-[13px] text-gray-500">Ladda upp minst en bild av fasaden/utsidan och en bild av insidan. Agenten använder bilderna för att skriva en bättre beskrivning.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed rounded-xl p-4 min-h-[120px] flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Bild utsida *</span>
                    {input.outdoorImageUrl ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/50">
                        <img src={input.outdoorImageUrl} alt="Utsida" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => updateInput({ outdoorImageUrl: "" })}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80"
                          aria-label="Ta bort bild"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { cropSlotRef.current = "outdoor"; imageInputRef.current?.click(); }}
                        disabled={imageUploading}
                        className="py-3 px-4 bg-navy text-white text-[13px] font-semibold rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
                      >
                        {imageUploading ? "Laddar upp..." : "Ladda upp bild"}
                      </button>
                    )}
                  </div>
                  <div className="border-2 border-dashed rounded-xl p-4 min-h-[120px] flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Bild insida *</span>
                    {input.indoorImageUrl ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/50">
                        <img src={input.indoorImageUrl} alt="Insida" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => updateInput({ indoorImageUrl: "" })}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80"
                          aria-label="Ta bort bild"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { cropSlotRef.current = "indoor"; imageInputRef.current?.click(); }}
                        disabled={imageUploading}
                        className="py-3 px-4 bg-navy text-white text-[13px] font-semibold rounded-xl hover:bg-navy/90 transition-colors disabled:opacity-60"
                      >
                        {imageUploading ? "Laddar upp..." : "Ladda upp bild"}
                      </button>
                    )}
                  </div>
                  <div className="border-2 border-dashed rounded-xl p-4 min-h-[100px] flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Planlösning (valfritt)</span>
                    {input.floorPlanImageUrl ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted/50">
                        <img src={input.floorPlanImageUrl} alt="Planlösning" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => updateInput({ floorPlanImageUrl: "" })}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80"
                          aria-label="Ta bort bild"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { cropSlotRef.current = "floorPlan"; imageInputRef.current?.click(); }}
                        disabled={imageUploading}
                        className="py-2.5 px-3 bg-muted/80 text-navy text-[13px] font-semibold rounded-xl hover:bg-muted transition-colors disabled:opacity-60"
                      >
                        {imageUploading ? "Laddar upp..." : "Ladda upp planlösning"}
                      </button>
                    )}
                  </div>
                  <div className="border-2 border-dashed rounded-xl p-4 min-h-[100px] flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Fler bilder (valfritt)</span>
                    <div className="flex flex-wrap gap-2">
                      {(input.extraImageUrls || []).map((url, i) => (
                        <div key={url} className="relative w-20 h-14 rounded-lg overflow-hidden bg-muted/50 shrink-0">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateInput({ extraImageUrls: (input.extraImageUrls || []).filter((_, j) => j !== i) })}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"
                            aria-label="Ta bort"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {((input.extraImageUrls?.length ?? 0) < 5) && (
                        <button
                          type="button"
                          onClick={() => { cropSlotRef.current = "extra"; imageInputRef.current?.click(); }}
                          disabled={imageUploading}
                          className="w-20 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-navy/40 hover:text-navy transition-colors disabled:opacity-60"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="border-2 border-dashed rounded-xl p-4 min-h-[100px] flex flex-col items-center justify-center gap-2 bg-muted/20 hover:bg-muted/30 transition-colors">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Video (valfritt)</span>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                    {input.videoUrl ? (
                      <div className="relative w-full">
                        <video src={input.videoUrl} controls className="max-h-32 rounded-lg" />
                        <button
                          type="button"
                          onClick={() => updateInput({ videoUrl: "" })}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80"
                          aria-label="Ta bort video"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={imageUploading}
                        className="py-2.5 px-3 bg-muted/80 text-navy text-[13px] font-semibold rounded-xl hover:bg-muted transition-colors disabled:opacity-60"
                      >
                        {imageUploading ? "Laddar upp..." : "Ladda upp video (MP4/WebM)"}
                      </button>
                    )}
                  </div>
                </div>
                {imageError && <p className="text-[12px] text-red-600">{imageError}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-6 w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              Generera annons
            </button>
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <GeneratingProgressBar
            done={aiDone}
            onComplete={() => setStep("preview")}
          />
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
                  imageUrls: generated.imageUrls,
                  videoUrl: generated.videoUrl,
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
                    <div className="flex flex-col gap-3">
                      {/* Publish */}
                      <button
                        type="button"
                        onClick={handlePublish}
                        className="w-full py-3 px-4 bg-navy text-white text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        </svg>
                        Publicera annons
                      </button>
                      {/* Download PDF */}
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={pdfDownloading}
                        className="w-full py-3 px-4 bg-muted/80 text-navy text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {pdfDownloading ? (
                          <span className="animate-pulse">Laddar ner...</span>
                        ) : (
                          <>
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Ladda ner PDF (gratis)
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleRegenerate}
                        disabled={generationVersion >= MAX_REGENERATIONS || regenerating}
                        className="w-full py-3.5 px-4 bg-muted/80 text-navy text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {regenerating ? "Genererar..." : `Generera ny text (${generationVersion}/${MAX_REGENERATIONS})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => { cropSlotRef.current = null; imageInputRef.current?.click(); }}
                        disabled={imageUploading}
                        className="w-full py-3.5 px-4 bg-muted/80 text-navy text-[13px] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        {imageUploading ? "Laddar upp..." : generated.imageUrl ? "Byt bild" : "Ladda upp fler bilder"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStep("input"); setGenerateError(""); }}
                        className="w-full py-2.5 text-[12px] text-gray-500 hover:text-navy transition-colors"
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

        {/* Step: Done */}
        {step === "done" && (
          <div className="bg-white rounded-2xl border border-border/60 p-6 sm:p-8 shadow-sm animate-fade-in text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-navy/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-navy">&#10003;</span>
            </div>
            <h2 className="text-xl font-bold text-navy mb-2">Tack!</h2>
            <p className="text-[13px] text-gray-500 mb-8 max-w-md mx-auto">
              Vill du publicera annonsen live på HittaYta.se och nå tusentals potentiella hyresgäster?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handlePublish}
                className="py-3.5 px-6 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide text-center hover:bg-navy/90 transition-colors"
              >
                Publicera annons
              </button>
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
