"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const STEPS = [
  {
    id: 1,
    title: "Planera din uthyrning",
    teaser:
      "För att få ut det mesta av din lokal behöver du ha koll på förutsättningarna. Tänk igenom vem som passar som hyresgäst, vilket pris som är rimligt och vad konkurrensen ser ut i området.",
    full: `Innan du sätter upp en annons är det smart att göra en snabb analys. Vilken typ av verksamhet passar lokalen bäst – butik, kontor, restaurang? Vad finns det för efterfrågan i trakten? Vad tar andra liknande lokaler i närheten?

Ta reda på lokens starka sidor: läge, kommunikationer, parkering, takhöjd. Dessa faktorer avgör både intresset och priset. En väl genomtänkt planering ger dig ett tryggare utgångsläge när intressenter börjar höra av sig.`,
  },
  {
    id: 2,
    title: "Marknadsför din lokal",
    teaser:
      "Annonsen är ofta det första intrycket en intressent får av din lokal. Satsa på saker som verkligen säljer – bra bilder, tydlig beskrivning och en rubrik som fångar uppmärksamheten.",
    full: `En bra annons innehåller professionella bilder som visar hela lokalen: fasad, insida, eventuellt kök eller gemensamma utrymmen. Om du har en planlösning – inkludera den. Många hyresgäster vill förstå flödet och storleken på rummen.

Beskrivningen ska vara konkret: storlek i kvm, takhöjd, vilka tillbehör som ingår (hisar, lastbrygga, fiber). Undvik floskler – siffror och fakta överträffar alltid vaga formuleringar. På Hittayta.se kan du generera en professionell annons med hjälp av AI om du vill spara tid.`,
  },
  {
    id: 3,
    title: "Välj rätt hyresgäst",
    teaser:
      "Alla intressenter är inte lika passande. Fundera över vilken typ av verksamhet som är stabil, långsiktig och passar lokalen – och vilka som kanske kräver mer av dig som hyresvärd.",
    full: `Ta reda på vad sökanden ska använda lokalen till. Matchar det lokalen och eventuella bestämmelser (t.ex. för restaurang)? Har företaget verksamhet sedan tidigare, eller är det ett nytt projekt? Referenser och årsredovisning kan ge en indikation på stabilitet.

Tänk också praktiskt: hur ofta behöver du ha kontakt med hyresgästen? Vissa verksamheter kräver mer dialog – andra är mer självgående. Välj en hyresgäst som känns trygg både affärsmässigt och i det dagliga samarbetet.`,
  },
  {
    id: 4,
    title: "Förhandling och kontrakt",
    teaser:
      "När ni hittat varandra är det dags att formalisera uthyrningen. Ett tydligt avtal skyddar båda parter och minskar risken för missförstånd längre fram.",
    full: `Ha alltid ett skriftligt hyresavtal. Det ska täcka hyra, löptid, uppsägningstid, vad som ingår (värme, el, städning m.m.) och ansvarsfördelning vid skador eller underhåll.

Förhandla öppet kring priset – många hyresgäster uppskattar transparens. Om ni kommer överens om avtal i flera år kan det vara motiverat med en indexering eller fast hyra. Beroende på lokalens storlek och värde kan det vara värt att låta en jurist eller mäklare granska avtalet innan ni skriver på.`,
  },
  {
    id: 5,
    title: "Tillträde",
    teaser:
      "När allt är klubbat är det dags för tillträde. En genomtänkt överlämning gör att den nya hyresgästen kan komma igång smidigt och att du undviker problem i efterhand.",
    full: `Gå igenom lokalen tillsammans vid tillträde. Notera skick på väggar, golv och fönster – dokumentera med bilder om ni vill undvika dispyter vid flytt. Skriv upp vad som ingår och i vilket skick det överlämnas.

Ge hyresgästen tydlig info om elmätning, soprum, nycklar och eventuella regler för fastigheten. Ha en kontaktperson eller rutin för frågor de första veckorna. Ju smidigare starten är, desto enklare blir samarbetet framåt.`,
  },
];

export default function SaHyrDuUtClient() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-navy overflow-hidden min-h-[280px]">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <Link
            href="/"
            className="inline-block text-[12px] text-white/50 hover:text-white/80 mb-6 transition-colors tracking-wide"
          >
            &larr; Tillbaka till startsidan
          </Link>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/50 mb-2">Guide</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Så hyr du ut en lokal
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Fem steg från planering till tillträde. En praktisk guide för dig som ska hyra ut en kommersiell lokal.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {STEPS.map((step) => {
            const isExpanded = expandedId === step.id;
            return (
              <article
                key={step.id}
                className="bg-white rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6 sm:p-8">
                  <span className="inline-block text-[11px] font-bold text-navy/50 tracking-widest mb-3">
                    STEG {step.id}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-navy tracking-tight mb-4">
                    {step.title}
                  </h2>
                  <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
                    {step.teaser}
                  </p>
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t border-border/40">
                      <p className="text-[15px] text-gray-600 leading-relaxed whitespace-pre-line">
                        {step.full}
                      </p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : step.id)}
                    className="text-[13px] font-semibold text-navy hover:underline focus:outline-none focus:ring-2 focus:ring-navy/20 focus:ring-offset-2 rounded px-1 py-0.5"
                  >
                    {isExpanded ? "Visa mindre" : "Läs hela texten"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 bg-navy rounded-2xl text-center">
          <h3 className="text-xl font-bold text-white mb-2">Redo att annonsera?</h3>
          <p className="text-white/70 text-[15px] mb-6 max-w-lg mx-auto">
            Skapa en annons på Hittayta.se och når tusentals sökande. Kom igång på några minuter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/skapa-annons"
              className="inline-flex items-center justify-center px-6 py-3 bg-gold text-navy font-semibold rounded-xl hover:bg-gold-light transition-colors"
            >
              Skapa annons
            </Link>
            <Link
              href="/annonspaket"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
            >
              Se annonspaket
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
