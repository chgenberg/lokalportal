"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { availableTags, categoryLabels, typeLabels } from "@/lib/types";

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface FormData {
  title: string;
  type: "sale" | "rent" | "";
  category: "butik" | "kontor" | "lager" | "ovrigt" | "";
  city: string;
  address: string;
  price: string;
  size: string;
  description: string;
  tags: string[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const initialForm: FormData = {
  title: "", type: "", category: "", city: "", address: "",
  price: "", size: "", description: "", tags: [],
  contactName: "", contactEmail: "", contactPhone: "",
};

const stepLabels = ["Grundinfo", "Detaljer", "Egenskaper", "Granska"];

export default function CreateListingModal({ open, onClose }: CreateListingModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Pre-fill contact info from session
  useEffect(() => {
    if (session?.user && !form.contactName) {
      setForm((f) => ({
        ...f,
        contactName: f.contactName || session.user.name || "",
        contactEmail: f.contactEmail || session.user.email || "",
      }));
    }
  }, [session, form.contactName]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const update = useCallback((partial: Partial<FormData>) => {
    setForm((f) => ({ ...f, ...partial }));
    setError("");
  }, []);

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  const validateStep = (s: Step): string | null => {
    if (s === 1) {
      if (!form.title.trim()) return "Ange en rubrik";
      if (!form.type) return "Valj typ (uthyres eller till salu)";
      if (!form.category) return "Valj kategori";
      return null;
    }
    if (s === 2) {
      if (!form.city.trim()) return "Ange stad";
      if (!form.address.trim()) return "Ange adress";
      if (!form.price || Number(form.price) <= 0) return "Ange ett giltigt pris";
      if (!form.size || Number(form.size) <= 0) return "Ange en giltig storlek";
      if (!form.description.trim()) return "Skriv en beskrivning";
      return null;
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(s + 1, 4) as Step);
  };

  const prev = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!session?.user) { router.push("/logga-in"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          type: form.type,
          category: form.category,
          price: Number(form.price),
          size: Number(form.size),
          tags: form.tags,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Kunde inte skapa annons");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setForm(initialForm);
        setStep(1);
        setSubmitted(false);
        setSubmitting(false);
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch {
      setError("Nagot gick fel. Forsok igen.");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setForm(initialForm);
      setStep(1);
      setError("");
      setSubmitted(false);
      setSubmitting(false);
    }, 300);
  };

  const formatPrice = (price: string, type: string) => {
    const n = Number(price);
    if (!n) return "—";
    if (type === "sale") return `${(n / 1000000).toFixed(1)} mkr`;
    return `${n.toLocaleString("sv-SE")} kr/man`;
  };

  if (!open) return null;

  // Success state
  if (submitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-white rounded-2xl p-10 text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-navy/[0.04] flex items-center justify-center glow">
            <span className="text-2xl">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2 tracking-tight">Annons publicerad</h2>
          <p className="text-[13px] text-gray-400">Din annons ar nu live och synlig for alla besokare.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/40">
          <div>
            <h2 className="text-lg font-bold text-navy tracking-tight">Skapa annons</h2>
            <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide">
              Steg {step} av 4 &middot; {stepLabels[step - 1]}
            </p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy/[0.03] transition-colors text-gray-400 hover:text-navy">
            &times;
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-border/30">
          <div
            className="h-full bg-navy transition-all duration-500 ease-out"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {error && (
            <div className="mb-5 p-3 bg-navy/[0.03] border border-navy/10 rounded-xl text-[13px] text-navy animate-slide-down">
              {error}
            </div>
          )}

          {/* Step 1: Basic info */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Rubrik</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="T.ex. Modern kontorslokal i centrala Stockholm"
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Typ</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["rent", "sale"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update({ type: t })}
                        className={`py-3 rounded-xl text-[13px] font-semibold transition-all border ${
                          form.type === t
                            ? "bg-navy text-white border-navy"
                            : "bg-white text-gray-500 border-border/60 hover:border-navy/20"
                        }`}
                      >
                        {typeLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => update({ category: e.target.value as FormData["category"] })}
                    className="w-full appearance-none px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  >
                    <option value="">Valj kategori</option>
                    {Object.entries(categoryLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Stad</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update({ city: e.target.value })}
                    placeholder="Stockholm"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Adress</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => update({ address: e.target.value })}
                    placeholder="Drottninggatan 45"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Pris {form.type === "sale" ? "(kr)" : "(kr/man)"}
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => update({ price: e.target.value })}
                    placeholder={form.type === "sale" ? "3500000" : "25000"}
                    min="0"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Storlek (m&sup2;)</label>
                  <input
                    type="number"
                    value={form.size}
                    onChange={(e) => update({ size: e.target.value })}
                    placeholder="120"
                    min="0"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Beskrivning</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="Beskriv lokalen i detalj. Nämn planlösning, skick, utrustning, tillträde..."
                  rows={5}
                  className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all resize-none leading-relaxed"
                />
                <p className="text-[11px] text-gray-300 mt-1.5">{form.description.length}/2000 tecken</p>
              </div>
            </div>
          )}

          {/* Step 3: Tags & Contact */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-3 tracking-[0.1em] uppercase">Egenskaper</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const active = form.tags.includes(tag);
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
                </div>
              </div>

              <div className="border-t border-border/40 pt-6">
                <label className="block text-[11px] font-semibold text-gray-400 mb-3 tracking-[0.1em] uppercase">Kontaktuppgifter</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => update({ contactName: e.target.value })}
                    placeholder="Kontaktperson"
                    className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => update({ contactEmail: e.target.value })}
                      placeholder="E-post"
                      className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                    />
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => update({ contactPhone: e.target.value })}
                      placeholder="Telefon"
                      className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border/60 focus:border-navy/30 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="animate-fade-in">
              <p className="text-[11px] font-semibold text-gray-400 mb-4 tracking-[0.1em] uppercase">Forhandsgranskning</p>

              {/* Preview card */}
              <div className="rounded-2xl border border-border/60 overflow-hidden glow-light mb-6">
                {/* Simulated image area */}
                <div className="h-40 bg-gradient-to-br from-navy/[0.06] to-navy/[0.12] relative flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-white/80 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-sm font-bold text-navy/50">
                        {form.category ? categoryLabels[form.category]?.charAt(0) : "?"}
                      </span>
                    </div>
                    <span className="text-[10px] text-navy/30 font-semibold tracking-[0.1em] uppercase">
                      {form.category ? categoryLabels[form.category] : "Kategori"}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {form.type && (
                      <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-navy/90 text-white backdrop-blur-sm tracking-wide">
                        {typeLabels[form.type]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-navy text-[15px] mb-1.5 tracking-tight leading-snug">
                    {form.title || "Rubrik saknas"}
                  </h3>
                  <p className="text-[12px] text-gray-400 mb-3 tracking-wide">
                    {form.address || "Adress"}, {form.city || "Stad"}
                  </p>
                  <p className="text-[13px] text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                    {form.description || "Beskrivning saknas"}
                  </p>

                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {form.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-navy/[0.04] text-navy/60 tracking-wide">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <span className="text-[12px] text-gray-400 tracking-wide">{form.size || "—"} m&sup2;</span>
                    <span className="text-base font-bold text-navy tracking-tight">
                      {formatPrice(form.price, form.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact preview */}
              <div className="rounded-xl border border-border/40 p-4">
                <p className="text-[11px] font-semibold text-gray-400 mb-2 tracking-[0.1em] uppercase">Kontakt</p>
                <div className="flex items-center gap-4 text-[13px]">
                  <span className="text-navy font-medium">{form.contactName || session?.user?.name || "—"}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400">{form.contactEmail || session?.user?.email || "—"}</span>
                  {form.contactPhone && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-400">{form.contactPhone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-border/40 bg-muted/30">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={prev}
                className="text-[13px] font-semibold text-gray-400 hover:text-navy transition-colors"
              >
                &larr; Tillbaka
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Step dots */}
            <div className="hidden sm:flex items-center gap-1.5 mr-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? "w-6 bg-navy" : s < step ? "w-1.5 bg-navy/30" : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>

            {step < 4 ? (
              <button
                type="button"
                onClick={next}
                className="btn-glow px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl tracking-wide"
              >
                Fortsatt &rarr;
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
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
