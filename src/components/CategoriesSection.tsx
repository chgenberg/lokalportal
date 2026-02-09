"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const categoryConfig = [
  { key: "butik", label: "Butik", description: "Butikslokaler i attraktiva lägen med bra exponering mot gata." },
  { key: "kontor", label: "Kontor", description: "Moderna kontorslokaler med flexibla planlösningar." },
  { key: "lager", label: "Lager", description: "Lagerlokaler med bra logistikläge och lastmöjligheter." },
  { key: "ovrigt", label: "Övrigt", description: "Ateljéer, studios, pop-up lokaler och andra unika utrymmen." },
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
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Kategorier</p>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Utforska lokaler</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryConfig.map((cat) => (
            <Link
              key={cat.key}
              href={`/annonser?category=${cat.key}`}
              className="card-glow group relative py-10 px-6 bg-white rounded-2xl border border-border/60 text-center glow-light"
            >
              <h3 className="text-lg font-bold text-navy mb-2 tracking-tight group-hover:text-navy-light transition-colors">
                {cat.label}
              </h3>
              <p className="text-[12px] text-gray-400 mb-4 leading-relaxed max-w-[200px] mx-auto">{cat.description}</p>
              <span className="inline-block text-[11px] font-semibold text-navy/30 group-hover:text-navy transition-colors tracking-[0.15em] uppercase">
                {byCategory[cat.key] ?? 0} annonser &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
