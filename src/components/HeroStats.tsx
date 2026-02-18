"use client";

import { useEffect, useState, useRef } from "react";

interface Stats {
  totalListings: number;
  totalCities: number;
}

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
    <div ref={ref} className="text-center px-6 sm:px-10 md:px-14">
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight tabular-nums">
        {count}+
      </div>
      <div className="text-[12px] font-medium text-white/70 mt-1.5 tracking-[0.12em] uppercase">
        {label}
      </div>
    </div>
  );
}

function StaticStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-6 sm:px-10 md:px-14">
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
        {value}
      </div>
      <div className="text-[12px] font-medium text-white/70 mt-1.5 tracking-[0.12em] uppercase">
        {label}
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
          setStats({
            totalListings: data.totalListings ?? 0,
            totalCities: data.totalCities ?? 0,
          });
        }
      } catch { /* silent */ }
    };
    fetchStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="max-w-5xl mx-auto rounded-3xl px-6 py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-center gap-y-6">
        <CountUpStat value={stats.totalListings} label="Lokaler" />
        <div className="hidden sm:block h-12 w-px bg-white/20 shrink-0" aria-hidden />
        <CountUpStat value={stats.totalCities} label="Städer" />
        <div className="hidden sm:block h-12 w-px bg-white/20 shrink-0" aria-hidden />
        <StaticStat value="500+" label="Annonsörer" />
      </div>
    </div>
  );
}
