"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalListings: number;
  totalCities: number;
}

export default function HeroStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalListings: data.totalListings ?? 0,
            totalCities: data.totalCities ?? 0,
          });
        }
      } catch {
        // keep null, show nothing or fallback
      }
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{stats.totalListings}+</div>
        <div className="text-sm text-white/60 mt-1">Lokaler</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{stats.totalCities}+</div>
        <div className="text-sm text-white/60 mt-1">Städer</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white">500+</div>
        <div className="text-sm text-white/60 mt-1">Aktiva annonsörer</div>
      </div>
    </div>
  );
}
