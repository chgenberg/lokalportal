"use client";

import { useState, useEffect, useRef } from "react";

const FACTS = [
  "Visste du att kontorslokaler i Sverige har en genomsnittlig vakansgrad på 7–10 %?",
  "En bra annons med bilder får i snitt 3× fler visningsförfrågningar.",
  "Första intrycket av en lokal avgörs inom 7 sekunder – precis som med människor.",
  "Lokaler nära kollektivtrafik värderas i snitt 15–20 % högre.",
  "Över 60 % av alla lokalsökningar börjar online.",
  "En professionell planritning ökar intresset med upp till 30 %.",
  "Genomsnittlig tid för att hyra ut en kommersiell lokal i Sverige är 3–6 månader.",
  "Ljusinsläpp är den mest efterfrågade egenskapen bland hyresgäster.",
  "Flexibla kontorslösningar har ökat med 40 % sedan 2020.",
  "Energicertifikat kan påverka hyresnivån med upp till 10 %.",
  "De flesta hyresgäster besöker 4–6 lokaler innan de bestämmer sig.",
  "En välskriven beskrivning kan halvera tiden det tar att hitta rätt hyresgäst.",
  "Parkeringsplatser är den näst mest sökta egenskapen efter yta.",
  "Hyresnivåer i Stockholms innerstad har stigit med 25 % de senaste 5 åren.",
  "Lagerlokaler har blivit den snabbast växande segmentet inom kommersiella fastigheter.",
];

const DURATION_MS = 60_000; // 60 seconds total
const FACT_INTERVAL_MS = 6_000; // New fact every 6 seconds

interface GeneratingProgressBarProps {
  /** Set to true when agent result is ready – bar jumps to 100% and triggers onComplete */
  done?: boolean;
  /** Called when bar reaches 100% (either naturally or because done=true) */
  onComplete?: () => void;
}

export default function GeneratingProgressBar({ done, onComplete }: GeneratingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [factFading, setFactFading] = useState(false);
  const startRef = useRef(Date.now());
  const completedRef = useRef(false);

  // Smooth progress animation
  useEffect(() => {
    if (done) {
      setProgress(100);
      if (!completedRef.current) {
        completedRef.current = true;
        // Small delay so user sees 100%
        const t = setTimeout(() => onComplete?.(), 600);
        return () => clearTimeout(t);
      }
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      // Ease-out curve: fast start, slows down approaching 95%
      const linear = Math.min(elapsed / DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - linear, 0.4);
      const pct = Math.min(eased * 95, 95); // Never exceeds 95% until done
      setProgress(pct);
    };

    const id = setInterval(tick, 200);
    tick();
    return () => clearInterval(id);
  }, [done, onComplete]);

  // Rotate facts
  useEffect(() => {
    const id = setInterval(() => {
      setFactFading(true);
      setTimeout(() => {
        setFactIndex((i) => (i + 1) % FACTS.length);
        setFactFading(false);
      }, 400);
    }, FACT_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const roundedProgress = Math.round(progress);

  return (
    <div className="bg-white rounded-2xl border border-border/60 p-8 sm:p-12 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy/[0.06] mb-4">
          <svg className="w-7 h-7 text-navy animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <h3 className="text-[17px] font-semibold text-navy mb-1">Skapar din annons</h3>
        <p className="text-[13px] text-gray-400">
          Vi hämtar platsinformation, analyserar bilder och skriver en säljande annons
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #1B2A4A 0%, #C9A96E 100%)",
            }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">Bearbetar</span>
        <span className="text-[13px] font-semibold text-navy tabular-nums">{roundedProgress}%</span>
      </div>

      {/* Fun fact */}
      <div className="bg-navy/[0.03] rounded-xl p-5 min-h-[72px] flex items-center">
        <div className="flex gap-3 items-start">
          <svg className="w-4 h-4 text-gold mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h1M4.22 19.78l.71-.71M12 17a5 5 0 100-10 5 5 0 000 10z" /></svg>
          <p
            className={`text-[13px] leading-relaxed text-gray-500 transition-opacity duration-400 ${
              factFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {FACTS[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
