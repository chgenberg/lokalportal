"use client";

import { useState } from "react";
import Link from "next/link";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function KontaktPage() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const isValid = form.name.trim() && form.email.trim() && form.subject.trim() && form.message.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Något gick fel");
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-light opacity-90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/40 mb-3">Kontakt</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Hör av dig till oss</h1>
          <p className="text-white/50 text-[15px] max-w-lg mx-auto leading-relaxed">
            Har du frågor, synpunkter eller behöver hjälp? Fyll i formuläret nedan så återkommer vi så snart vi kan.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Kontaktuppgifter</p>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">E-post</p>
                  <a href="mailto:info@ledigyta.se" className="text-[14px] font-medium text-navy hover:underline">info@ledigyta.se</a>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 tracking-wide mb-0.5">Plats</p>
                  <p className="text-[14px] font-medium text-navy">Stockholm, Sverige</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Svarstid</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Vi svarar vanligtvis inom 24 timmar på vardagar. Vid brådskande ärenden, ange det i ämnesraden.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Vanliga frågor</p>
              <div className="space-y-2">
                <Link href="/annonspaket" className="block text-[13px] text-navy/60 hover:text-navy transition-colors">
                  Annonspaket och priser &rarr;
                </Link>
                <Link href="/villkor" className="block text-[13px] text-navy/60 hover:text-navy transition-colors">
                  Användarvillkor &rarr;
                </Link>
                <Link href="/integritetspolicy" className="block text-[13px] text-navy/60 hover:text-navy transition-colors">
                  Integritetspolicy &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {status === "sent" ? (
              <div className="bg-white rounded-2xl border border-border/40 p-12 shadow-sm text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-navy/[0.04] flex items-center justify-center">
                  <span className="text-2xl text-navy/40">&check;</span>
                </div>
                <h2 className="text-xl font-bold text-navy mb-2 tracking-tight">Tack för ditt meddelande</h2>
                <p className="text-[13px] text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
                  Vi har tagit emot ditt meddelande och återkommer till dig så snart vi kan, vanligtvis inom 24 timmar.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="btn-glow px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl"
                >
                  Skicka ett nytt meddelande
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm space-y-5">
                <div>
                  <label htmlFor="contact-name" className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Namn
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ditt namn"
                    className="w-full px-4 py-3 rounded-xl text-sm border border-border/60 bg-muted/50 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    E-postadress
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="din@email.se"
                    className="w-full px-4 py-3 rounded-xl text-sm border border-border/60 bg-muted/50 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Ämne
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="Vad gäller ditt ärende?"
                    className="w-full px-4 py-3 rounded-xl text-sm border border-border/60 bg-muted/50 focus:border-navy/30 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">
                    Meddelande
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Beskriv ditt ärende..."
                    className="w-full px-4 py-3 rounded-xl text-sm border border-border/60 bg-muted/50 focus:border-navy/30 focus:bg-white outline-none transition-all resize-none"
                  />
                </div>

                {status === "error" && (
                  <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-[13px] text-red-600">
                      Något gick fel. Försök igen eller skicka ett mejl direkt till <a href="mailto:info@ledigyta.se" className="underline">info@ledigyta.se</a>.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isValid || status === "sending"}
                  className="btn-glow w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {status === "sending" ? "Skickar..." : "Skicka meddelande"}
                </button>

                <p className="text-[11px] text-gray-300 text-center">
                  Genom att skicka godkänner du vår <Link href="/integritetspolicy" className="underline hover:text-gray-400 transition-colors">integritetspolicy</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
