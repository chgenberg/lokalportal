"use client";

import { useState } from "react";

const packages = [
  {
    id: "basic",
    name: "Bas",
    price: 495,
    period: "30 dagar",
    description: "Perfekt för enstaka annonser",
    features: ["1 annons", "30 dagars visning", "Grundläggande statistik", "E-postsupport"],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Professionell",
    price: 995,
    period: "30 dagar",
    description: "Mest populär bland fastighetsägare",
    features: ["5 annonser", "60 dagars visning", "Utvald-markering", "Detaljerad statistik", "Prioriterad support", "Sociala medier-delning"],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Företag",
    price: 2495,
    period: "30 dagar",
    description: "För professionella fastighetsbolag",
    features: ["Obegränsat antal annonser", "90 dagars visning", "Toppplacering i sök", "Egen företagssida", "Avancerad statistik", "Dedikerad kontaktperson", "API-åtkomst"],
    highlighted: false,
  },
];

export default function AnnonspaketPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const getPrice = (basePrice: number) => {
    if (billingPeriod === "yearly") return Math.round(basePrice * 0.8);
    return basePrice;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-navy mb-2">Annonspaket</h1>
          <p className="text-gray-500">Välj det paket som passar din verksamhet bäst</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center gap-4 mb-14">
          <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-navy" : "text-gray-400"}`}>Månadsvis</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
            className="relative w-14 h-7 bg-navy rounded-full transition-colors"
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${billingPeriod === "yearly" ? "translate-x-8" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${billingPeriod === "yearly" ? "text-navy" : "text-gray-400"}`}>
            Årsvis <span className="ml-1.5 text-xs text-navy font-semibold">-20%</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                pkg.highlighted ? "border-navy shadow-lg scale-[1.02]" : "border-border"
              }`}
            >
              {pkg.highlighted && (
                <div className="bg-navy text-white text-center py-2 text-xs font-semibold uppercase tracking-wider">Mest populär</div>
              )}
              <div className="p-8">
                <h3 className="text-xl font-bold text-navy mb-1">{pkg.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{pkg.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-navy">{getPrice(pkg.price)}</span>
                  <span className="text-sm text-gray-500 ml-1">kr/{pkg.period}</span>
                </div>
                <a
                  href="/logga-in"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    pkg.highlighted ? "bg-navy text-white hover:bg-navy-light" : "bg-navy text-white hover:bg-navy-light"
                  }`}
                >
                  Kom igång med BankID
                </a>
                <ul className="mt-8 space-y-3">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-navy font-bold text-sm mt-0.5">&check;</span>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-navy text-center mb-10">Vanliga frågor</h2>
          <div className="space-y-4">
            {[
              { q: "Hur fungerar BankID-verifieringen?", a: "Du loggar in med ditt BankID för att verifiera din identitet. Detta säkerställer att alla annonsörer är verifierade och ökar tryggheten för alla användare." },
              { q: "Kan jag uppgradera mitt paket?", a: "Ja, du kan uppgradera när som helst. Du betalar bara mellanskillnaden för resterande period." },
              { q: "Vad händer när min annons löper ut?", a: "Du får ett meddelande innan annonsen löper ut med möjlighet att förlänga. Utgångna annonser arkiveras och kan återaktiveras." },
              { q: "Finns det någon bindningstid?", a: "Nej, det finns ingen bindningstid. Du betalar per period och kan avsluta när du vill." },
            ].map((faq) => (
              <details key={faq.q} className="group bg-muted rounded-xl border border-border">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium text-navy list-none">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-90 transition-transform">&rarr;</span>
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
