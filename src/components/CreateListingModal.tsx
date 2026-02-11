"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { availableTags, categoryLabels, typeLabels } from "@/lib/types";
import type { Listing } from "@/lib/types";
import CustomSelect from "./CustomSelect";

const ListingMap = dynamic(() => import("./ListingMap"), { ssr: false });

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
      const res = await fetch("/api/listings/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: input.address.trim(),
          type: input.type,
          category: input.category,
          price: priceNum,
          size: sizeNum,
          highlights: input.highlights.trim() || undefined,
        }),
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

  const handlePublish = async () => {
    if (!session?.user || !generated) return;
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

  const formatPrice = (price: number, type: string) => {
    if (type === "sale") return `${(price / 1_000_000).toFixed(1)} mkr`;
    return `${price.toLocaleString("sv-SE")} kr/mån`;
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
              className="btn-glow w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide text-center"
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
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-navy/[0.04] flex items-center justify-center glow">
            <span className="text-2xl">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2 tracking-tight">Annons publicerad</h2>
          <p className="text-[13px] text-gray-400">Din annons är nu live och synlig för alla besökare.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={handleClose} />

      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/40">
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

        <div className="flex-1 overflow-y-auto px-8 py-6">
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
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Adress
                  </label>
                  <input
                    type="text"
                    value={input.address}
                    onChange={(e) => updateInput({ address: e.target.value })}
                    placeholder="T.ex. Storgatan 12, Göteborg"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                          className={`py-3 rounded-xl text-[13px] font-semibold transition-all border ${
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                      Pris {input.type === "sale" ? "(kr)" : "(kr/mån)"}
                    </label>
                    <input
                      type="number"
                      value={input.price}
                      onChange={(e) => updateInput({ price: e.target.value })}
                      placeholder={input.type === "sale" ? "3500000" : "25000"}
                      min="0"
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

          {step === "preview" && generated && (
            <div className="space-y-6 animate-fade-in">
              {publishError && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700"
                >
                  {publishError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                  Rubrik
                </label>
                <input
                  type="text"
                  value={generated.title}
                  onChange={(e) => setGenerated((g) => (g ? { ...g, title: e.target.value } : g))}
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                  Beskrivning
                </label>
                <textarea
                  value={generated.description}
                  onChange={(e) => setGenerated((g) => (g ? { ...g, description: e.target.value } : g))}
                  rows={8}
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-2 tracking-[0.1em] uppercase">
                  Egenskaper (klicka för att lägga till/ta bort)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const active = generated.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all border ${
                          active
                            ? "bg-navy text-white border-navy"
                            : "bg-white text-gray-500 border-border/60 hover:border-navy/20 hover:text-navy"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                  {generated.tags.filter((t) => !availableTags.includes(t as (typeof availableTags)[number])).length > 0 && (
                    <span className="text-[12px] text-gray-400 self-center">
                      + {generated.tags.filter((t) => !availableTags.includes(t as (typeof availableTags)[number])).join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {generated.areaSummary && (
                <div className="rounded-xl border border-border/40 p-4 bg-muted/20">
                  <p className="text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Områdesinformation (används i annonsen)
                  </p>
                  <p className="text-[13px] text-gray-600 leading-relaxed">{generated.areaSummary}</p>
                </div>
              )}

              {(generated.lat !== 0 || generated.lng !== 0) && (
                <div className="rounded-xl border border-border/60 overflow-hidden h-48">
                  <ListingMap
                    listings={
                      [
                        {
                          id: "preview",
                          title: generated.title,
                          description: "",
                          city: generated.city,
                          address: generated.address,
                          type: generated.type,
                          category: generated.category,
                          price: generated.price,
                          size: generated.size,
                          imageUrl: "",
                          featured: false,
                          createdAt: new Date().toISOString(),
                          lat: generated.lat,
                          lng: generated.lng,
                          tags: generated.tags,
                          contact: { name: "", email: "", phone: "" },
                        },
                      ] as Listing[]
                    }
                    singleMarker
                    center={[generated.lat, generated.lng]}
                    zoom={14}
                  />
                </div>
              )}

              <div className="rounded-2xl border border-border/60 overflow-hidden glow-light">
                <div className="h-32 bg-gradient-to-br from-navy/[0.06] to-navy/[0.12] flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-navy/25 tracking-[0.2em] uppercase">
                    {categoryLabels[generated.category]}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-navy text-[15px] mb-1.5">{generated.title || "Rubrik"}</h3>
                  <p className="text-[12px] text-gray-400 mb-3">
                    {generated.address}, {generated.city}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <span className="text-[12px] text-gray-400">{generated.size} m²</span>
                    <span className="text-base font-bold text-navy">{formatPrice(generated.price, generated.type)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-5 border-t border-border/40 bg-muted/30">
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
                className="btn-glow px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide"
              >
                Skapa annons med AI
              </button>
            )}

            {step === "preview" && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={submitting}
                className="btn-glow px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide disabled:opacity-50"
              >
                {submitting ? "Publicerar..." : "Publicera annons"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
