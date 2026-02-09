"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const categoryConfig = [
  { key: "butik", label: "Butik", description: "Butikslokaler i attraktiva lagen med bra exponering mot gata." },
  { key: "kontor", label: "Kontor", description: "Moderna kontorslokaler med flexibla planlosningar." },
  { key: "lager", label: "Lager", description: "Lagerlokaler med bra logistiklage och lastmojligheter." },
  { key: "ovrigt", label: "Ovrigt", description: "Ateljeer, studios, pop-up lokaler och andra unika utrymmen." },
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categoryConfig.map((cat, i) => (
            <Link
              key={cat.key}
              href={`/annonser?category=${cat.key}`}
              className="card-glow group relative p-7 bg-white rounded-2xl border border-border/60 glow-light"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <div className="w-11 h-11 mb-5 rounded-xl bg-navy/[0.04] flex items-center justify-center group-hover:bg-navy transition-all duration-300">
                <span className="text-[13px] font-bold text-navy group-hover:text-white transition-colors tracking-wide">
                  {cat.label.charAt(0)}
                </span>
              </div>
              <h3 className="text-base font-semibold text-navy mb-2 tracking-tight">
                {cat.label}
              </h3>
              <p className="text-[13px] text-gray-400 mb-5 leading-relaxed">{cat.description}</p>
              <span className="text-[11px] font-semibold text-navy/40 group-hover:text-navy transition-colors tracking-wide uppercase">
                {byCategory[cat.key] ?? 0} annonser
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
