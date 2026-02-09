import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Om oss – Hittayta.se",
  description: "Lär känna Hittayta.se – Sveriges moderna marknadsplats för kommersiella lokaler.",
};

export default function OmOssPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-light opacity-90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 text-center">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/40 mb-3">Om oss</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Vi förenklar jakten på rätt lokal</h1>
          <p className="text-white/50 text-[15px] max-w-lg mx-auto leading-relaxed">
            Hittayta.se är Sveriges moderna marknadsplats för kommersiella lokaler. Vi kopplar samman fastighetsägare med företag som söker sin nästa lokal.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Vår mission</p>
          <h2 className="text-xl font-bold text-navy mb-4 tracking-tight">Att göra lokalmarknaden transparent och tillgänglig</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
            Vi tror att det ska vara enkelt att hitta rätt lokal. Oavsett om du letar efter en butik på bästa läge, ett modernt kontor eller ett lager med god logistik – Hittayta.se samlar allt på ett ställe.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            Genom verifierade annonsörer, smarta sökfilter och en transparent process skapar vi trygghet för både hyresvärdar och hyresgäster.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { title: "Transparens", text: "Alla annonsörer verifieras. Ingen dold information, inga överraskningar." },
            { title: "Enkelhet", text: "Från sökning till kontakt – hela processen ska vara smidig och intuitiv." },
            { title: "Trygghet", text: "BankID-verifiering och tydliga villkor skapar en säker marknadsplats." },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm text-center">
              <h3 className="text-base font-bold text-navy mb-2 tracking-tight">{v.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Så fungerar det</p>
          <h2 className="text-xl font-bold text-navy mb-6 tracking-tight">Tre steg till din nya lokal</h2>
          <div className="space-y-6">
            {[
              { step: "01", title: "Sök och filtrera", text: "Använd våra smarta filter för att hitta lokaler som matchar dina behov – stad, storlek, pris och kategori." },
              { step: "02", title: "Utforska och jämför", text: "Läs detaljerade beskrivningar, se lokalen på kartan och jämför alternativ sida vid sida." },
              { step: "03", title: "Kontakta direkt", text: "Skicka ett meddelande direkt till hyresvärden via plattformen. Tryggt och smidigt." },
            ].map((s) => (
              <div key={s.step} className="flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-navy/[0.04] flex items-center justify-center shrink-0">
                  <span className="text-[13px] font-bold text-navy/50 tabular-nums">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-navy mb-1 tracking-tight">{s.title}</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For landlords */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">För fastighetsägare</p>
          <h2 className="text-xl font-bold text-navy mb-4 tracking-tight">Nå rätt hyresgäster snabbare</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
            Som annonsör på Hittayta.se får du tillgång till en kvalificerad målgrupp av företag som aktivt söker lokaler. Vår plattform gör det enkelt att publicera annonser, hantera förfrågningar och kommunicera med potentiella hyresgäster.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/annonspaket" className="btn-glow px-6 py-2.5 bg-navy text-white text-[13px] font-semibold rounded-xl">
              Se annonspaket
            </Link>
            <Link href="/kontakt" className="px-6 py-2.5 border border-navy/20 text-navy text-[13px] font-semibold rounded-xl hover:bg-navy/[0.03] transition-colors">
              Kontakta oss
            </Link>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-navy rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Har du frågor?</h2>
          <p className="text-[13px] text-white/40 mb-6">Vi finns här för att hjälpa dig. Tveka inte att höra av dig.</p>
          <Link href="/kontakt" className="btn-glow inline-block px-6 py-2.5 bg-white text-navy text-[13px] font-semibold rounded-xl">
            Kontakta oss
          </Link>
        </div>
      </div>
    </div>
  );
}
