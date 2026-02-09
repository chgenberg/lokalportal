"use client";

import { useEffect, useState } from "react";

interface Stats { totalListings: number; totalCities: number; }

export default function HeroStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({ totalListings: data.totalListings ?? 0, totalCities: data.totalCities ?? 0 });
        }
      } catch { /* silent */ }
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  const items = [
    { value: `${stats.totalListings}+`, label: "Lokaler" },
    { value: `${stats.totalCities}+`, label: "Städer" },
    { value: "500+", label: "Annonsörer" },
  ];

  return (
    <div className="mt-16 flex items-center justify-center gap-12 md:gap-16">
      {items.map((item, i) => (
        <div key={i} className="text-center">
          <div className="text-2xl font-bold text-white tracking-tight">{item.value}</div>
          <div className="text-[11px] font-medium text-white/30 mt-1 tracking-[0.15em] uppercase">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
