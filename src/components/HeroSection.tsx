"use client";

import { useEffect, useState, useRef } from "react";
import HeroCarousel from "./HeroCarousel";
import HeroSearch from "./HeroSearch";

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || end === 0) return;
    started.current = true;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(easeOut * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

interface Stats {
  totalListings: number;
  totalCities: number;
}

function GlassStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <div
      className="opacity-0 animate-fade-in-up text-center"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight tabular-nums drop-shadow-sm">
        {value}
      </div>
      <div className="text-[10px] sm:text-[11px] font-medium text-white/60 mt-1 tracking-[0.15em] uppercase">
        {label}
      </div>
    </div>
  );
}

function CountUpGlassStat({ end, label, delay }: { end: number; label: string; delay: number }) {
  const count = useCountUp(end, 2200);
  return <GlassStat value={`${count}+`} label={label} delay={delay} />;
}

export default function HeroSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLElement>(null);

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

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    const el = heroRef.current;
    el?.addEventListener("mousemove", handleMouseMove);
    return () => el?.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
    >
      {/* Fullscreen carousel background */}
      <HeroCarousel />

      {/* Interactive spotlight that follows mouse */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700 opacity-20 hidden md:block"
        style={{
          background: `radial-gradient(circle 400px at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(201, 169, 110, 0.12), transparent)`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Kicker */}
        <div
          className="opacity-0 animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-md mb-6 sm:mb-8"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
          </span>
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.15em] uppercase text-white/70">
            Sveriges off-market plattform
          </span>
        </div>

        {/* Headline */}
        <h1
          className="opacity-0 animate-fade-in-up text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-4 sm:mb-6"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        >
          Hitta din drömbostad
          <br />
          <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
            innan alla andra
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="opacity-0 animate-fade-in-up text-sm sm:text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10"
          style={{ animationDelay: "600ms", animationFillMode: "forwards" }}
        >
          Exklusiv tillgång till villor, lägenheter och fritidshus som aldrig når den öppna marknaden. Verifierade säljare. Trygga affärer.
        </p>

        {/* Search bar with glass effect */}
        <div
          className="opacity-0 animate-fade-in-up max-w-xl mx-auto mb-10 sm:mb-14"
          style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
        >
          <div className="p-1.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <HeroSearch />
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: "1000ms", animationFillMode: "forwards" }}
          >
            <div className="inline-flex items-center gap-6 sm:gap-10 md:gap-14 px-6 sm:px-10 py-5 sm:py-6 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08]">
              <CountUpGlassStat end={stats.totalListings} label="Bostäder" delay={1100} />
              <div className="h-8 sm:h-10 w-px bg-white/10" aria-hidden />
              <CountUpGlassStat end={stats.totalCities} label="Städer" delay={1200} />
              <div className="h-8 sm:h-10 w-px bg-white/10" aria-hidden />
              <GlassStat value="500+" label="Säljare" delay={1300} />
            </div>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fade-in"
        style={{ animationDelay: "1800ms", animationFillMode: "forwards" }}
      >
        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => {
          window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" });
        }}>
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/30">
            Utforska
          </span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-white/50 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
