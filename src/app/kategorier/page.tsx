"use client";

import Link from "next/link";
import {
  Store,
  Briefcase,
  Warehouse,
  LayoutGrid,
  ArrowRight,
  TrendingUp,
  MapPin,
} from "lucide-react";

const categories = [
  {
    id: "butik",
    icon: Store,
    label: "Butikslokaler",
    description:
      "Hitta den perfekta butikslokalen i attraktiva lägen med hög exponering. Allt från gallerior till gatuplan.",
    features: ["Skyltfönster", "Centrala lägen", "Hög gångtrafik"],
    count: 3,
    gradient: "from-blue-500 to-blue-700",
  },
  {
    id: "kontor",
    icon: Briefcase,
    label: "Kontorslokaler",
    description:
      "Moderna kontorslokaler med flexibla planlösningar. Från kontorshotell till hela våningsplan.",
    features: ["Fiber & IT", "Mötesrum", "Flexibla ytor"],
    count: 4,
    gradient: "from-indigo-500 to-indigo-700",
  },
  {
    id: "lager",
    icon: Warehouse,
    label: "Lagerlokaler",
    description:
      "Lagerlokaler i strategiska lägen med bra logistikförutsättningar. Lastbryggor och stora portar.",
    features: ["Lastbrygga", "Bra logistik", "Stora ytor"],
    count: 2,
    gradient: "from-slate-500 to-slate-700",
  },
  {
    id: "ovrigt",
    icon: LayoutGrid,
    label: "Övriga lokaler",
    description:
      "Unika lokaler för kreativa verksamheter. Ateljéer, studios, pop-up butiker och mycket mer.",
    features: ["Kreativa ytor", "Flexibelt", "Unika lägen"],
    count: 1,
    gradient: "from-violet-500 to-violet-700",
  },
];

export default function KategorierPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-navy mb-2">Kategorier</h1>
          <p className="text-gray-500">
            Utforska våra lokalkategorier och hitta det som passar ditt behov
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/annonser?category=${cat.id}`}
              className="group relative bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Top gradient bar */}
              <div className={`h-2 bg-gradient-to-r ${cat.gradient}`} />

              <div className="p-8">
                <div className="flex items-start gap-5">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <cat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-navy group-hover:text-accent transition-colors">
                        {cat.label}
                      </h2>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                      {cat.description}
                    </p>

                    {/* Features tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cat.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1 bg-muted text-xs font-medium text-gray-600 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        {cat.count} annonser
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        Hela Sverige
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-muted rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-navy mb-3">
            Hittar du inte rätt kategori?
          </h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            Kontakta oss så hjälper vi dig hitta en lokal som passar dina
            specifika behov.
          </p>
          <Link
            href="/annonser"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors"
          >
            Visa alla annonser
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
