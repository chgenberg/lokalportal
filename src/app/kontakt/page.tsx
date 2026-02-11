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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Göran väntar på ditt mejl</h1>
          <p className="text-white/50 text-[15px] max-w-lg mx-auto leading-relaxed">
            Har du frågor, förslag eller bara vill prata takhöjder? Fyll i formuläret nedan. Göran svarar personligen – oftast med utropstecken.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Göran card */}
            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-navy/[0.06] flex items-center justify-center shrink-0">
                  <span className="text-xl">🏢</span>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-navy">Göran Ytström</p>
                  <p className="text-[11px] text-gray-400">Grundare & Chefslokalletare</p>
                </div>
              </div>
              <p className="text-[13px] text-gray-500 leading-relaxed italic">
                &ldquo;Skriv till mig. Jag läser varje meddelande. Ibland två gånger om det handlar om skyltfönster.&rdquo;
              </p>
            </div>

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
                  <p className="text-[12px] text-gray-400 mt-0.5">Kontoret har 3,2 m takhöjd. Göran mätte.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Svarstid</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                Göran svarar vanligtvis inom 24 timmar på vardagar. Om du nämner &ldquo;skyltfönster&rdquo; i ämnesraden svarar han inom 2.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-4">Vanliga frågor</p>
              <div className="space-y-2">
                <Link href="/annonspaket" className="block text-[13px] text-navy/60 hover:text-navy transition-colors">
                  Annonspaket och priser &rarr;
                </Link>
                <Link href="/skapa-annons" className="block text-[13px] text-navy/60 hover:text-navy transition-colors">
                  Skapa gratis annons-PDF &rarr;
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
                <h2 className="text-xl font-bold text-navy mb-2 tracking-tight">Tack! Göran har fått ditt meddelande</h2>
                <p className="text-[13px] text-gray-400 mb-2 leading-relaxed max-w-sm mx-auto">
                  Han läser det just nu med en kopp kaffe (hans fjärde idag). Räkna med svar inom 24 timmar.
                </p>
                <p className="text-[12px] text-gray-300 mb-6 italic">&ldquo;Varje meddelande förtjänar ett ordentligt svar. Utom spam. Spam förtjänar papperskorgen.&rdquo; – Göran</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="btn-glow px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl"
                >
                  Skicka ett nytt meddelande
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-navy/[0.03] rounded-2xl border border-navy/10 p-5">
                  <p className="text-[13px] text-navy/70 leading-relaxed">
                    <span className="font-semibold">Tips från Göran:</span> Ju mer detaljer du ger, desto bättre kan jag hjälpa dig. Berätta gärna vilken typ av lokal du söker, var, och om takhöjd är viktigt (det borde det vara).
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      placeholder="Beskriv ditt ärende... Göran uppskattar detaljer (och komplimanger om hans plattform)."
                      className="w-full px-4 py-3 rounded-xl text-sm border border-border/60 bg-muted/50 focus:border-navy/30 focus:bg-white outline-none transition-all resize-none"
                    />
                  </div>

                  {status === "error" && (
                    <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-[13px] text-red-600">
                        Något gick fel. Göran skyller på servern. Försök igen eller mejla direkt till <a href="mailto:info@ledigyta.se" className="underline">info@ledigyta.se</a>.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!isValid || status === "sending"}
                    className="btn-glow w-full py-3.5 bg-navy text-white text-[13px] font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {status === "sending" ? "Skickar till Göran..." : "Skicka meddelande"}
                  </button>

                  <p className="text-[11px] text-gray-300 text-center">
                    Genom att skicka godkänner du vår <Link href="/integritetspolicy" className="underline hover:text-gray-400 transition-colors">integritetspolicy</Link>.
                    Göran lovar att inte dela dina uppgifter med någon. Inte ens Kvadrat.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
