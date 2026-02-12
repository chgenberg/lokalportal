"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScrollReveal from "./ScrollReveal";

const categoryConfig = [
  { key: "butik", label: "Butik", description: "Butikslokaler i attraktiva lägen med bra exponering mot gata." },
  { key: "kontor", label: "Kontor", description: "Moderna kontorslokaler med flexibla planlösningar." },
  { key: "lager", label: "Lager", description: "Lagerlokaler med bra logistikläge och lastmöjligheter." },
  { key: "restaurang", label: "Restaurang/Café", description: "Restaurang- och cafélokaler med köksutrustning och serveringstillstånd." },
  { key: "verkstad", label: "Verkstad/Industri", description: "Verkstads- och industrilokaler med hög takhöjd och bra tillgänglighet." },
  { key: "showroom", label: "Showroom", description: "Showroomlokaler för produktvisning och kundmöten." },
  { key: "popup", label: "Pop-up", description: "Korttidslokaler för pop-up butiker, event och tillfälliga projekt." },
  { key: "atelje", label: "Ateljé/Studio", description: "Kreativa lokaler för ateljéer, studios och konstnärlig verksamhet." },
  { key: "gym", label: "Gym/Träningslokal", description: "Lokaler anpassade för gym, yoga och andra träningsverksamheter." },
  { key: "ovrigt", label: "Övrigt", description: "Andra typer av kommersiella lokaler och unika utrymmen." },
];

export default function CategoriesSection() {
  const [byCategory, setByCategory] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setByCategory(data.byCategory ?? {});
        }
      } catch { /* silent */ }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Kategorier</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Utforska lokaler</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {categoryConfig.map((cat, i) => (
            <ScrollReveal key={cat.key} delay={i * 80}>
              <Link
                href={`/annonser?category=${cat.key}`}
                className="group relative block py-6 sm:py-10 px-4 sm:px-6 bg-white rounded-2xl border border-border/60 text-center transition-all duration-500 hover:border-navy/15 hover:shadow-md hover:-translate-y-1"
              >
                <h3 className="text-lg font-bold text-navy mb-2 tracking-tight group-hover:text-navy-light transition-colors">
                  {cat.label}
                </h3>
                <p className="text-[12px] text-gray-400 mb-4 leading-relaxed max-w-[200px] mx-auto">{cat.description}</p>
                <span className="inline-block text-[11px] font-semibold text-navy/30 group-hover:text-navy transition-colors tracking-[0.15em] uppercase">
                  {byCategory[cat.key] ?? 0} annonser &rarr;
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
