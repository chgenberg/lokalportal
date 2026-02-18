"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const LANDLORD_STEPS = [
  {
    id: 1,
    label: "Steg 1",
    title: "Publicera din lokal",
    description:
      "Din lokal visas för tusentals sökande genom våra externa samarbeten för att säkerställa maximal exponering. Skapa en professionell annons med hjälp av vår AI-agent på bara några minuter.",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    imageAlt: "Modernt kontor med stora fönster",
  },
  {
    id: 2,
    label: "Steg 2",
    title: "Hitta den perfekta hyresgästen",
    description:
      "Mottag kontaktförfrågningar eller kontakta matchande hyresgäster i appen. Vi verifierar dem och kan hjälpa dig välja den bästa hyresgästen för dig.",
    image:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
    imageAlt: "Affärsmöte mellan hyresvärd och hyresgäst",
  },
  {
    id: 3,
    label: "Steg 3",
    title: "Förhandla och skriv kontrakt",
    description:
      "Förhandla villkoren direkt på plattformen. Vi guidar dig genom processen och ser till att avtalet skyddar båda parter – från hyra och löptid till ansvarsfördelning.",
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
    imageAlt: "Kontraktsskrivning och förhandling",
  },
  {
    id: 4,
    label: "Steg 4",
    title: "Tillträde och överlämning",
    description:
      "När allt är klart genomför ni en gemensam besiktning och överlämning. Dokumentera skick, lämna nycklar och ge hyresgästen allt de behöver för en smidig start.",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    imageAlt: "Nyckelöverlämning vid tillträde",
  },
];

const TENANT_STEPS = [
  {
    id: 1,
    label: "Steg 1",
    title: "Sök och hitta rätt lokal",
    description:
      "Bläddra bland hundratals lokaler filtrerade på stad, typ och storlek. Använd vår karta för att hitta det perfekta läget för din verksamhet.",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
    imageAlt: "Person söker lokal på dator",
  },
  {
    id: 2,
    label: "Steg 2",
    title: "Kontakta hyresvärden",
    description:
      "Skicka en intresseanmälan direkt via plattformen. Beskriv din verksamhet och dina behov så att hyresvärden kan bedöma om ni matchar.",
    image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80",
    imageAlt: "Kommunikation via plattformen",
  },
  {
    id: 3,
    label: "Steg 3",
    title: "Besök och utvärdera",
    description:
      "Boka en visning och se lokalen på plats. Kontrollera att den uppfyller dina krav gällande yta, läge, tillgänglighet och teknisk standard.",
    image:
      "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80",
    imageAlt: "Visning av lokal",
  },
  {
    id: 4,
    label: "Steg 4",
    title: "Flytta in och kom igång",
    description:
      "När kontraktet är påskrivet är det dags att flytta in. En smidig överlämning gör att du kan fokusera på det viktigaste – din verksamhet.",
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
    imageAlt: "Inflyttning i ny lokal",
  },
];

const FEATURES = [
  {
    title: "Annonsering av lokaler",
    description:
      "Nordens största annonsplats för uthyrning av kommersiella lokaler. För hyresgivare och hyressökande.",
  },
  {
    title: "AI-genererade annonser",
    description:
      "Skapa professionella annonser på minuter med hjälp av vår AI-agent. Beskriv din lokal och få en färdig annons direkt.",
  },
  {
    title: "Garanterad trygghet",
    description:
      "Garanterad hyra, förförhandlad kontakt och ett team av experter för en modern och trygg hyresupplevelse.",
  },
];

export default function SaHyrDuUtClient() {
  const [activeTab, setActiveTab] = useState<"landlord" | "tenant">("landlord");
  const steps = activeTab === "landlord" ? LANDLORD_STEPS : TENANT_STEPS;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-10 sm:pt-16 md:pt-24 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-navy/40 mb-3 sm:mb-4">
            Så fungerar det
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-navy tracking-tight mb-3 sm:mb-5">
            HYR MED HITTAYTA
          </h1>
          <p className="text-gray-500 text-sm sm:text-lg md:text-xl max-w-xl mx-auto">
            Hantera din uthyrning på rätt sätt – tryggt och enkelt.
          </p>
        </div>
      </section>

      {/* Feature cards row */}
      <section className="pb-10 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-muted/40 rounded-xl sm:rounded-2xl p-5 sm:p-8"
            >
              <h3 className="text-sm sm:text-base font-semibold text-navy mb-1 sm:mb-2">
                {f.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* "Så fungerar det" steps section */}
      <section className="pb-14 sm:pb-20 md:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-navy tracking-tight mb-2 sm:mb-3">
              Så fungerar det
            </h2>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg max-w-lg mx-auto mb-5 sm:mb-8">
              Tryggt och enkelt att hyra ut eller hitta en lokal
            </p>

            {/* Tab toggle */}
            <div className="inline-flex items-center bg-muted/60 rounded-full p-1">
              <button
                type="button"
                onClick={() => setActiveTab("landlord")}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "landlord"
                    ? "bg-navy text-white shadow-sm"
                    : "text-gray-500 hover:text-navy"
                }`}
              >
                Hyr ut
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tenant")}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "tenant"
                    ? "bg-navy text-white shadow-sm"
                    : "text-gray-500 hover:text-navy"
                }`}
              >
                Hitta lokal
              </button>
            </div>
          </div>

          {/* Step cards */}
          <div className="space-y-10 sm:space-y-16 md:space-y-24">
            {steps.map((step, idx) => {
              const imageLeft = idx % 2 === 0;
              return (
                <div
                  key={`${activeTab}-${step.id}`}
                  className={`flex flex-col ${
                    imageLeft ? "md:flex-row" : "md:flex-row-reverse"
                  } items-center gap-5 sm:gap-8 md:gap-12 lg:gap-16`}
                >
                  {/* Image */}
                  <div className="w-full md:w-1/2 flex-shrink-0">
                    <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-muted/40">
                      <Image
                        src={step.image}
                        alt={step.imageAlt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="w-full md:w-1/2">
                    <p className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-navy/40 mb-1.5 sm:mb-2">
                      {step.label}
                    </p>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-navy tracking-tight mb-2 sm:mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-500 text-sm sm:text-base md:text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-14 sm:pb-20 md:pb-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center bg-navy rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-14">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">
            Redo att komma igång?
          </h3>
          <p className="text-white/60 text-sm sm:text-base md:text-lg mb-5 sm:mb-8 max-w-lg mx-auto">
            Skapa en annons på Hittayta.se och nå tusentals sökande. Kom igång
            på några minuter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/skapa-annons"
              className="inline-flex items-center justify-center px-6 sm:px-7 py-3 sm:py-3.5 bg-gold text-navy text-sm sm:text-base font-semibold rounded-full hover:brightness-105 transition-all"
            >
              Skapa annons
            </Link>
            <Link
              href="/annonser"
              className="inline-flex items-center justify-center px-6 sm:px-7 py-3 sm:py-3.5 bg-white/10 text-white text-sm sm:text-base font-medium rounded-full hover:bg-white/20 transition-colors"
            >
              Utforska lokaler
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
