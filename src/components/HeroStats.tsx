"use client";

import { useEffect, useState, useRef } from "react";

interface Stats { totalListings: number; totalCities: number; }

function useCountUp(end: number, duration = 1500, startOnView = true) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setCount(end);
      return;
    }
    const el = ref.current;
    if (!el || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(easeOut * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, startOnView, hasAnimated]);

  return { count, ref };
}

function CountUpStat({ value, label }: { value: number; label: string }) {
  const { count, ref } = useCountUp(value);

  return (
    <div ref={ref} className="flex items-center">
      <div className="text-center px-4 sm:px-8 md:px-12">
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">{count}+</div>
        <div className="text-[11px] font-medium text-white/80 mt-1 tracking-[0.15em] uppercase">{label}</div>
      </div>
    </div>
  );
}

function StaticStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center">
      <div className="text-center px-4 sm:px-8 md:px-12">
        <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{value}</div>
        <div className="text-[11px] font-medium text-white/80 mt-1 tracking-[0.15em] uppercase">{label}</div>
      </div>
    </div>
  );
}

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

  return (
    <div className="mt-10 sm:mt-16 flex items-center justify-center flex-wrap gap-y-4">
      <CountUpStat value={stats.totalListings} label="Lokaler" />
      <div className="h-8 w-px bg-white/20 mx-2 md:mx-4 shrink-0" aria-hidden />
      <CountUpStat value={stats.totalCities} label="Städer" />
      <div className="h-8 w-px bg-white/20 mx-2 md:mx-4 shrink-0" aria-hidden />
      <StaticStat value="500+" label="Annonsörer" />
    </div>
  );
}
