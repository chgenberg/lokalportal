"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const categoryConfig = [
  { key: "butik", label: "Butik", description: "Butikslokaler i attraktiva lägen med bra exponering mot gata.", href: "/annonser?category=butik" },
  { key: "kontor", label: "Kontor", description: "Moderna kontorslokaler med flexibla planlösningar.", href: "/annonser?category=kontor" },
  { key: "lager", label: "Lager", description: "Lagerlokaler med bra logistikläge och lastmöjligheter.", href: "/annonser?category=lager" },
  { key: "ovrigt", label: "Övrigt", description: "Ateljéer, studios, pop-up lokaler och andra unika utrymmen.", href: "/annonser?category=ovrigt" },
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
      } catch { /* keep empty */ }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-navy mb-3">Utforska kategorier</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Hitta den perfekta lokalen baserat på ditt behov</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryConfig.map((cat) => (
            <Link
              key={cat.key}
              href={cat.href}
              className="group relative p-8 bg-white rounded-2xl border border-border hover:border-navy/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 mb-5 rounded-xl bg-navy/5 flex items-center justify-center group-hover:bg-navy transition-all duration-300">
                <span className="text-sm font-bold text-navy group-hover:text-white transition-colors">
                  {cat.label.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2 group-hover:text-navy-light transition-colors">
                {cat.label}
              </h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{cat.description}</p>
              <span className="text-xs font-medium text-navy/60 group-hover:text-navy transition-colors">
                {byCategory[cat.key] ?? 0} annonser &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
