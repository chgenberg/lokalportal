"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  villa: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
  lagenhet: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
  fritidshus: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&q=80",
  tomt: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
  ovrigt: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80",
};

const categoryConfig = [
  { key: "villa", label: "Villa" },
  { key: "lagenhet", label: "Lägenhet" },
  { key: "fritidshus", label: "Fritidshus" },
  { key: "tomt", label: "Tomt" },
  { key: "ovrigt", label: "Övrigt" },
];

export default function CategoriesSection() {
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const rafRef = useRef<number>(0);
  const speedRef = useRef(0.5);

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

  const tick = useCallback(() => {
    const el = scrollRef.current;
    if (el && !paused.current) {
      el.scrollLeft += speedRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 1) {
        el.scrollLeft = 0;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const handlePointerEnter = () => { paused.current = true; };
  const handlePointerLeave = () => { paused.current = false; };

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-8 sm:mb-12">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">Kategorier</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Utforska bostäder</h2>
          </div>
        </ScrollReveal>

        <div
          ref={scrollRef}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 scrollbar-thin scroll-smooth"
        >
          <div className="flex gap-4 sm:gap-5 min-w-max">
            {[...categoryConfig, ...categoryConfig].map((cat, i) => (
              <Link
                key={`${cat.key}-${i}`}
                href={`/annonser?category=${cat.key}`}
                className="group flex-shrink-0 w-[170px] sm:w-[200px]"
              >
                <div className="bg-white rounded-3xl border border-border/50 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
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
                    <h3 className="text-[14px] sm:text-[15px] font-bold text-navy mb-1 tracking-tight">{cat.label}</h3>
                    <p className="text-[11px] text-gray-400 mb-3">{byCategory[cat.key] ?? 0} annonser</p>
                    <span className="inline-block px-4 py-2 rounded-full bg-navy text-white text-[11px] sm:text-[12px] font-semibold transition-colors group-hover:bg-navy-light">
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
