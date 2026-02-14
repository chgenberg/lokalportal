"use client";

import { useState } from "react";
import BookingCalendar, { type BookingData } from "./BookingCalendar";

type Mode = "choose" | "email" | "callback";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  onEmailSubmitted?: (name: string, email: string) => void;
  onCallbackSubmitted?: (data: BookingData) => void;
}

export default function ContactModal({
  open,
  onClose,
  onEmailSubmitted,
  onCallbackSubmitted,
}: ContactModalProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const [emailName, setEmailName] = useState("");
  const [emailEmail, setEmailEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailDone, setEmailDone] = useState(false);

  if (!open) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailName.trim() || !emailEmail.trim()) return;
    setEmailSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailName.trim(),
          email: emailEmail.trim(),
          source: "chat",
        }),
      });
      if (!res.ok) throw new Error("Kunde inte skicka");
      setEmailDone(true);
      onEmailSubmitted?.(emailName.trim(), emailEmail.trim());
    } catch {
      alert("Kunde inte skicka. Försök igen.");
    } finally {
      setEmailSending(false);
    }
  };

  const handleCallbackComplete = (data: BookingData) => {
    onCallbackSubmitted?.(data);
    onClose();
    setMode("choose");
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setMode("choose");
      setEmailDone(false);
      setEmailName("");
      setEmailEmail("");
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal
      aria-label="Kontakta oss"
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-border/60 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-navy">Jag vill bli kontaktad</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-gray-500 hover:text-navy transition-colors"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {mode === "choose" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode("email")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border/60 hover:border-gold hover:bg-gold/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-navy/5 group-hover:bg-gold/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[15px] font-semibold text-navy">E-post</span>
                <span className="text-[12px] text-gray-500 text-center">Vi svarar inom 24 timmar</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("callback")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border/60 hover:border-gold hover:bg-gold/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-navy/5 group-hover:bg-gold/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-[15px] font-semibold text-navy">Telefon</span>
                <span className="text-[12px] text-gray-500 text-center">Jag vill bli uppringd</span>
              </button>
            </div>
          )}

          {mode === "email" && (
            <div>
              {emailDone ? (
                <div className="text-center py-6">
                  <p className="text-navy font-medium">Tack {emailName}!</p>
                  <p className="text-[13px] text-gray-500 mt-2">
                    Vi kommer att kontakta dig via e-post på <strong>{emailEmail}</strong> inom 24 timmar.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-4 px-6 py-2 bg-navy text-white text-sm font-medium rounded-xl"
                  >
                    Stäng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Namn *</label>
                    <input
                      type="text"
                      value={emailName}
                      onChange={(e) => setEmailName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg text-sm border border-border focus:border-navy outline-none"
                      placeholder="Ditt namn"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">E-post *</label>
                    <input
                      type="email"
                      value={emailEmail}
                      onChange={(e) => setEmailEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg text-sm border border-border focus:border-navy outline-none"
                      placeholder="din@email.se"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setMode("choose")} className="px-4 py-2 text-sm text-gray-500 hover:text-navy">
                      Tillbaka
                    </button>
                    <button
                      type="submit"
                      disabled={emailSending}
                      className="ml-auto px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl disabled:opacity-40"
                    >
                      {emailSending ? "Skickar..." : "Skicka"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {mode === "callback" && (
            <BookingCalendar variant="callback" onComplete={handleCallbackComplete} onBack={() => setMode("choose")} />
          )}
        </div>
      </div>
    </div>
  );
}
