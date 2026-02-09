"use client";

import { useState } from "react";

const packages = [
  {
    id: "basic", name: "Bas", price: 495, period: "30 dagar",
    description: "Perfekt for enstaka annonser",
    features: ["1 annons", "30 dagars visning", "Grundlaggande statistik", "E-postsupport"],
    highlighted: false,
  },
  {
    id: "pro", name: "Professionell", price: 995, period: "30 dagar",
    description: "Mest popular bland fastighetsagare",
    features: ["5 annonser", "60 dagars visning", "Utvald-markering", "Detaljerad statistik", "Prioriterad support", "Sociala medier-delning"],
    highlighted: true,
  },
  {
    id: "enterprise", name: "Foretag", price: 2495, period: "30 dagar",
    description: "For professionella fastighetsbolag",
    features: ["Obegransat antal annonser", "90 dagars visning", "Toppplacering i sok", "Egen foretagssida", "Avancerad statistik", "Dedikerad kontaktperson", "API-atkomst"],
    highlighted: false,
  },
];

export default function AnnonspaketPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const getPrice = (basePrice: number) => billingPeriod === "yearly" ? Math.round(basePrice * 0.8) : basePrice;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted/50 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">Priser</p>
          <h1 className="text-3xl font-bold text-navy tracking-tight mb-2">Annonspaket</h1>
          <p className="text-gray-400 text-[15px]">Valj det paket som passar din verksamhet bast</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className={`text-[13px] font-medium transition-colors ${billingPeriod === "monthly" ? "text-navy" : "text-gray-300"}`}>Manadsvis</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
            className="relative w-12 h-6 bg-navy/10 rounded-full transition-colors hover:bg-navy/15"
          >
            <div className={`absolute top-1 w-4 h-4 bg-navy rounded-full transition-transform ${billingPeriod === "yearly" ? "translate-x-7" : "translate-x-1"}`} />
          </button>
          <span className={`text-[13px] font-medium transition-colors ${billingPeriod === "yearly" ? "text-navy" : "text-gray-300"}`}>
            Arsvis <span className="ml-1 text-[11px] text-navy/60 font-semibold">-20%</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`card-glow relative rounded-2xl border overflow-hidden ${
                pkg.highlighted ? "border-navy/20 glow-strong" : "border-border/60 glow-light"
              }`}
            >
              {pkg.highlighted && (
                <div className="bg-navy text-white text-center py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em]">Mest popular</div>
              )}
              <div className="p-8">
                <h3 className="text-lg font-bold text-navy mb-1 tracking-tight">{pkg.name}</h3>
                <p className="text-[13px] text-gray-400 mb-6">{pkg.description}</p>
                <div className="mb-7">
                  <span className="text-4xl font-bold text-navy tracking-tight">{getPrice(pkg.price)}</span>
                  <span className="text-[13px] text-gray-400 ml-1">kr/{pkg.period}</span>
                </div>
                <a
                  href="/logga-in"
                  className={`btn-glow w-full flex items-center justify-center py-3 rounded-xl text-[13px] font-semibold tracking-wide ${
                    pkg.highlighted ? "bg-navy text-white" : "bg-navy/[0.04] text-navy hover:bg-navy hover:text-white"
                  } transition-all`}
                >
                  Kom igang
                </a>
                <ul className="mt-8 space-y-3">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-navy/40 font-medium text-[13px] mt-px">&check;</span>
                      <span className="text-[13px] text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-24 max-w-2xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3 text-center">FAQ</p>
          <h2 className="text-2xl font-bold text-navy text-center mb-10 tracking-tight">Vanliga fragor</h2>
          <div className="space-y-3">
            {[
              { q: "Hur fungerar BankID-verifieringen?", a: "Du loggar in med ditt BankID for att verifiera din identitet. Detta sakerst\u00e4ller att alla annonsorer ar verifierade och okar tryggheten for alla anvandare." },
              { q: "Kan jag uppgradera mitt paket?", a: "Ja, du kan uppgradera nar som helst. Du betalar bara mellanskillnaden for resterande period." },
              { q: "Vad hander nar min annons loper ut?", a: "Du far ett meddelande innan annonsen loper ut med mojlighet att forlanga. Utgangna annonser arkiveras och kan ateraktiveras." },
              { q: "Finns det nagon bindningstid?", a: "Nej, det finns ingen bindningstid. Du betalar per period och kan avsluta nar du vill." },
            ].map((faq) => (
              <details key={faq.q} className="group bg-white rounded-xl border border-border/60 glow-light">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-[13px] font-semibold text-navy list-none tracking-tight">
                  {faq.q}
                  <span className="text-gray-300 group-open:rotate-90 transition-transform text-sm">&rarr;</span>
                </summary>
                <div className="px-6 pb-4 text-[13px] text-gray-400 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
