"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

const IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80",
  "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=1920&q=80",
];
const ALT_TEXTS = [
  "Modern villa med trädgård",
  "Elegant villa med pool",
  "Ljus villa med stora fönster",
  "Exklusiv villa vid vattnet",
  "Modernt radhus med altan",
];
const INTERVAL = 7000;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out will-change-[opacity]"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <Image
            src={src}
            alt={ALT_TEXTS[i] ?? "Bostad till salu"}
            fill
            priority={i === 0}
            className="object-cover will-change-transform"
            style={{
              transform: `scale(1.1) translateY(${scrollY * 0.15}px)`,
              transition: i === current ? "transform 8s ease-out" : undefined,
            }}
            sizes="100vw"
          />
        </div>
      ))}

      {/* Multi-layer gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/50 to-navy/90" />
      <div className="absolute inset-0 bg-gradient-to-r from-navy/40 via-transparent to-navy/30" />

      {/* Subtle radial glow at center */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(201, 169, 110, 0.15), transparent)",
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="group relative h-3 transition-all duration-500 focus:outline-none"
            style={{ width: i === current ? 32 : 12 }}
            aria-label={`Bild ${i + 1}`}
          >
            <span className={`absolute inset-0 rounded-full transition-all duration-500 ${
              i === current
                ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                : "bg-white/30 group-hover:bg-white/60"
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}
