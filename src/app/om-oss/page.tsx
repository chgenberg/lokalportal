import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Om oss – Hittayta.se",
  description: "Möt Thomas Claesson och teamet bakom Hittayta.se – Sveriges modernaste marknadsplats för kommersiella lokaler.",
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            En man. En vision.<br />Väldigt många kvadratmeter.
          </h1>
          <p className="text-white/50 text-[15px] max-w-lg mx-auto leading-relaxed">
            Bakom Hittayta.se står Thomas Claesson – mannen som kan lukta sig till en bra lokal på 500 meters avstånd.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Thomas intro */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-navy/[0.06] flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <span className="text-4xl">🏢</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Grundare & Chefslokalletare</p>
              <h2 className="text-xl font-bold text-navy mb-1 tracking-tight">Thomas Claesson</h2>
              <p className="text-[13px] text-gray-400 mb-4">&ldquo;Jag har aldrig träffat en lokal jag inte gillade. Okej, kanske den i Borås utan fönster. Men annars.&rdquo;</p>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Thomas har jobbat med kommersiella lokaler i över 25 år. Det hela började 1998 när han av misstag hyrde ut sitt garage till en startup som behövde &ldquo;ett litet kontor med karaktär&rdquo;. Startupen gick under efter tre månader, men Thomas hade hittat sin livs passion: att matcha rätt lokal med rätt människa.
              </p>
            </div>
          </div>
        </div>

        {/* Thomass resa */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Thomass resa</p>
          <h2 className="text-xl font-bold text-navy mb-6 tracking-tight">Från garageuthyrning till Sveriges smartaste lokalplattform</h2>
          <div className="space-y-6">
            {[
              {
                year: "1998",
                title: "Det oavsiktliga geniet",
                text: "Thomas hyr ut sitt garage i Mölndal. Hyresgästen klagar på att det luktar motorolja. Thomas svarar: \"Det är karaktär.\" En bransch-legend föds.",
              },
              {
                year: "2003",
                title: "500 lokaler och en insikt",
                text: "Efter att ha förmedlat sin 500:e lokal inser Thomas att han kan uppskatta en lokals yta med blotta ögat, med max 2 m² felmarginal. Hans fru är mindre imponerad än han hade hoppats.",
              },
              {
                year: "2012",
                title: "\"Det måste finnas ett bättre sätt\"",
                text: "Thomas sitter i sin bil utanför en lokal i Västerås och scrollar genom PDF:er i sin mejl. Han bestämmer sig: lokalmarknaden behöver digitaliseras. Hans tonårsdotter förklarar vad en app är.",
              },
              {
                year: "2024",
                title: "Hittayta.se lanseras",
                text: "Efter år av research, prototyper och alldeles för mycket kaffe lanseras Hittayta.se – med AI-genererade annonser, kartvisning och Thomass personliga kvalitetsstämpel på varje funktion.",
              },
            ].map((item) => (
              <div key={item.year} className="flex gap-5">
                <div className="w-14 h-10 rounded-xl bg-navy/[0.04] flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-bold text-navy/60 tabular-nums">{item.year}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-navy mb-1 tracking-tight">{item.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fun facts */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Saker du inte visste om Thomas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { stat: "3 000+", label: "Lokaler personligen besökta", note: "Och han minns varje en." },
              { stat: "±2 m²", label: "Felmarginal vid ögonmått", note: "Testat och verifierat av hans fru." },
              { stat: "Kvadrat", label: "Hundens namn", note: "En golden retriever. Gillar öppna planlösningar." },
              { stat: "0", label: "Lokaler han ångrar", note: "Okej, kanske den i Borås." },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-2xl font-bold text-navy tracking-tight">{f.stat}</p>
                <p className="text-[13px] font-semibold text-navy/70 mt-0.5">{f.label}</p>
                <p className="text-[12px] text-gray-400 mt-1">{f.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission – seriös del */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Vår mission</p>
          <h2 className="text-xl font-bold text-navy mb-4 tracking-tight">Att göra lokalmarknaden transparent, snabb och – ja – lite roligare</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
            Bakom humorn finns ett genuint uppdrag. Lokalmarknaden har länge varit opak, långsam och onödigt krånglig. Vi bygger Hittayta.se för att ändra på det.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
            Varje annonsör verifieras med BankID. Varje annons kan skapas med AI på under fem minuter. Och varje hyresgäst kan söka, filtrera och kontakta direkt – utan mellanhänder, utan krångel.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            Thomas brukar säga: <em>&ldquo;En bra lokal kan förändra ett företag. En dålig plattform ska inte stå i vägen.&rdquo;</em> Vi håller med honom. Mest för att han är chefen.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { title: "Transparens", text: "Inga dolda avgifter, inga överraskningar. Förutom att Thomas ibland dyker upp med tårta.", icon: "🔍" },
            { title: "Enkelhet", text: "Från sökning till kontrakt – allt ska vara så smidigt att till och med Thomas klarar det.", icon: "✨" },
            { title: "Trygghet", text: "BankID-verifiering, tydliga villkor och en grundare som tar ditt förtroende på allvar.", icon: "🛡️" },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm text-center">
              <span className="text-2xl mb-3 block">{v.icon}</span>
              <h3 className="text-base font-bold text-navy mb-2 tracking-tight">{v.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        {/* Thomas-citat */}
        <div className="bg-navy/[0.03] rounded-2xl border border-navy/10 p-8 mb-6 text-center">
          <p className="text-[17px] text-navy/80 leading-relaxed italic max-w-lg mx-auto mb-4">
            &ldquo;Folk frågar mig varför jag brinner för lokaler. Jag svarar: har du någonsin stått i en tom lokal med 4,5 meters takhöjd och sydvänt skyltfönster? Exakt. Det är poesi.&rdquo;
          </p>
          <p className="text-[13px] font-semibold text-navy">Thomas Claesson</p>
          <p className="text-[12px] text-gray-400">Grundare, Hittayta.se</p>
        </div>

        {/* CTA */}
        <div className="bg-navy rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Vill du prata lokaler med Thomas?</h2>
          <p className="text-[13px] text-white/40 mb-6">Han svarar på allt. Utom frågor om den där lokalen i Borås.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/kontakt" className="btn-glow inline-block px-6 py-2.5 bg-white text-navy text-[13px] font-semibold rounded-xl">
              Kontakta oss
            </Link>
            <Link href="/skapa-annons" className="inline-block px-6 py-2.5 border border-white/15 text-white/70 text-[13px] font-medium rounded-xl hover:bg-white/[0.05] hover:text-white transition-all">
              Testa AI-verktyget
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
