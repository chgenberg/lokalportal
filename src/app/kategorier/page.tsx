"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const categoryConfig = [
  {
    id: "butik",
    label: "Butikslokaler",
    description: "Hitta den perfekta butikslokalen i attraktiva lägen med hög exponering. Allt från gallerior till gatuplan.",
    features: ["Skyltfönster", "Centrala lägen", "Hög gångtrafik"],
  },
  {
    id: "kontor",
    label: "Kontorslokaler",
    description: "Moderna kontorslokaler med flexibla planlösningar. Från kontorshotell till hela våningsplan.",
    features: ["Fiber & IT", "Mötesrum", "Flexibla ytor"],
  },
  {
    id: "lager",
    label: "Lagerlokaler",
    description: "Lagerlokaler i strategiska lägen med bra logistikförutsättningar. Lastbryggor och stora portar.",
    features: ["Lastbrygga", "Bra logistik", "Stora ytor"],
  },
  {
    id: "restaurang",
    label: "Restaurang & Café",
    description: "Restaurang- och cafélokaler med köksutrustning, ventilation och möjlighet till serveringstillstånd.",
    features: ["Kök", "Ventilation", "Serveringstillstånd"],
  },
  {
    id: "verkstad",
    label: "Verkstad & Industri",
    description: "Verkstads- och industrilokaler med hög takhöjd, bra tillgänglighet och tunga installationer.",
    features: ["Hög takhöjd", "Tunga installationer", "Bra tillgänglighet"],
  },
  {
    id: "showroom",
    label: "Showroom",
    description: "Representativa lokaler för produktvisning, kundmöten och utställningar i attraktiva lägen.",
    features: ["Representativt", "Kundmöten", "Utställning"],
  },
  {
    id: "popup",
    label: "Pop-up lokaler",
    description: "Korttidslokaler perfekta för pop-up butiker, event, marknadsföring och tillfälliga projekt.",
    features: ["Korttidsavtal", "Flexibelt", "Event"],
  },
  {
    id: "atelje",
    label: "Ateljé & Studio",
    description: "Kreativa lokaler för konstnärer, fotografer, designers och andra kreativa verksamheter.",
    features: ["Kreativa ytor", "Naturligt ljus", "Öppen planlösning"],
  },
  {
    id: "gym",
    label: "Gym & Träningslokal",
    description: "Lokaler anpassade för gym, yoga, dans och andra tränings- och hälsoverksamheter.",
    features: ["Hög takhöjd", "Ventilation", "Omklädningsrum"],
  },
  {
    id: "ovrigt",
    label: "Övriga lokaler",
    description: "Andra typer av kommersiella lokaler och unika utrymmen som inte passar i övriga kategorier.",
    features: ["Flexibelt", "Unika lägen", "Anpassningsbart"],
  },
];

export default function KategorierPage() {
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
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy mb-2">Kategorier</h1>
          <p className="text-gray-500">Utforska våra lokalkategorier och hitta det som passar ditt behov</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {categoryConfig.map((cat) => (
            <Link
              key={cat.id}
              href={`/annonser?category=${cat.id}`}
              className="group relative bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-navy/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="h-2 bg-navy" />
              <div className="p-5 sm:p-6 md:p-8">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center shrink-0 group-hover:bg-navy-light transition-colors duration-300">
                    <span className="text-xl font-bold text-white">{cat.label.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-navy">{cat.label}</h2>
                      <span className="text-gray-300 group-hover:text-navy group-hover:translate-x-1 transition-all">&rarr;</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{cat.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cat.features.map((feature) => (
                        <span key={feature} className="px-3 py-1 bg-muted text-xs font-medium text-gray-600 rounded-full">{feature}</span>
                      ))}
                    </div>
                    <p className="text-sm text-navy/60">{byCategory[cat.id] ?? 0} annonser &middot; Hela Sverige</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-muted rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-navy mb-3">Hittar du inte rätt kategori?</h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">Kontakta oss så hjälper vi dig hitta en lokal som passar dina specifika behov.</p>
          <Link href="/annonser" className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors">
            Visa alla annonser &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
