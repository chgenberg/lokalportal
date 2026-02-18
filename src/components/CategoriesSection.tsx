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
  { key: "butik", label: "Butik" },
  { key: "kontor", label: "Kontor" },
  { key: "lager", label: "Lager" },
  { key: "restaurang", label: "Restaurang/Café" },
  { key: "verkstad", label: "Verkstad/Industri" },
  { key: "showroom", label: "Showroom" },
  { key: "popup", label: "Pop-up" },
  { key: "atelje", label: "Ateljé/Studio" },
  { key: "gym", label: "Gym/Träningslokal" },
  { key: "ovrigt", label: "Övrigt" },
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
    <section className="py-14 sm:py-20 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-8 sm:mb-12">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">Kategorier</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Utforska lokaler</h2>
          </div>
        </ScrollReveal>

        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 scrollbar-thin">
          <div className="flex gap-4 sm:gap-5 min-w-max">
            {categoryConfig.map((cat) => (
              <Link
                key={cat.key}
                href={`/annonser?category=${cat.key}`}
                className="group flex-shrink-0 w-[180px] sm:w-[200px]"
              >
                <div className="bg-white rounded-3xl border border-border/50 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <div className="relative aspect-[4/3] rounded-t-3xl overflow-hidden">
                    <Image
                      src={UNSPLASH_BY_CATEGORY[cat.key] ?? UNSPLASH_BY_CATEGORY.ovrigt}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="200px"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-[15px] font-bold text-navy mb-1 tracking-tight">{cat.label}</h3>
                    <p className="text-[11px] text-gray-400 mb-3">{byCategory[cat.key] ?? 0} annonser</p>
                    <span className="inline-block px-4 py-2 rounded-full bg-navy text-white text-[12px] font-semibold transition-colors group-hover:bg-navy-light">
                      Visa mer
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
