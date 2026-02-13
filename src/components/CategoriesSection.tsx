"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  butik: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80",
  kontor: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  lager: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80",
  restaurang: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
  verkstad: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80",
  showroom: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80",
  popup: "https://images.unsplash.com/photo-1528698827591-e19cef791f48?w=600&q=80",
  atelje: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  ovrigt: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80",
};

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
                className="group relative block py-6 sm:py-10 px-4 sm:px-6 rounded-2xl border border-border/60 text-center overflow-hidden transition-all duration-500 hover:border-navy/15 hover:shadow-md hover:-translate-y-1 min-h-[180px] sm:min-h-[200px] flex flex-col justify-center"
              >
                <Image
                  src={UNSPLASH_BY_CATEGORY[cat.key] ?? UNSPLASH_BY_CATEGORY.ovrigt}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-navy/70 group-hover:bg-navy/60 transition-colors duration-300" />
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-white/95 transition-colors drop-shadow-sm">
                    {cat.label}
                  </h3>
                  <p className="text-[12px] text-white/80 mb-4 leading-relaxed max-w-[200px] mx-auto">{cat.description}</p>
                  <span className="inline-block text-[11px] font-semibold text-white/70 group-hover:text-white transition-colors tracking-[0.15em] uppercase">
                    {byCategory[cat.key] ?? 0} annonser &rarr;
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
