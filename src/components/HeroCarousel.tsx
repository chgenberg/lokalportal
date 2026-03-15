"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const IMAGES = [
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1920&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80",
];
const ALT_TEXTS = [
  "Stadsvy med bostäder",
  "Moderna bostäder med ljusa planlösningar",
  "Villa med trädgård",
  "Lägenhet med utsikt",
  "Fritidshus vid vattnet",
];
const INTERVAL = 6000;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(Array(IMAGES.length).fill(false));

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % IMAGES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  const markLoaded = (index: number) => {
    setLoaded((prev) => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
  };

  return (
    <>
      {/* Carousel images */}
      {IMAGES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <Image
            src={src}
            alt={ALT_TEXTS[i] ?? "Bostad till salu"}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="100vw"
            onLoad={() => markLoaded(i)}
          />
        </div>
      ))}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-navy/60" />

      {/* Gradient overlay bottom */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy/40 to-transparent" />

      {/* Dots indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? "bg-white w-7"
                : "w-2.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Bild ${i + 1}`}
          />
        ))}
      </div>
    </>
  );
}
