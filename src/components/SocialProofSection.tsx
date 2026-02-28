"use client";

import { useState } from "react";
import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "Thomas och hans team hjälpte oss hitta kontor på rekordtid. Agenten skrev annonserna åt oss – sparade flera timmar.",
    author: "Maria K.",
    role: "Fastighetsförvaltare, Stockholm",
  },
  {
    quote: "Vi fick fler seriösa förfrågningar på HittaYta än på någon annan plats. Thomas svarade personligen på alla våra frågor.",
    author: "Johan L.",
    role: "Hyresvärd, Göteborg",
  },
  {
    quote: "Hittade ett kontor med 4 meters takhöjd – precis som Thomas lovade. Bra sökfilter och snabb kontakt med annonsören.",
    author: "Anna S.",
    role: "Företagare",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5 justify-center mb-4" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-5 h-5 text-gold shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function SocialProofSection() {
  const [index, setIndex] = useState(0);
  const t = testimonials[index];

  return (
    <section className="py-14 sm:py-20 md:py-24 bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-500 mb-2">Vad andra säger</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Så upplever våra användare</h2>
          </div>
        </ScrollReveal>

        <div className="relative rounded-2xl sm:rounded-3xl py-6 sm:py-14 px-2 sm:px-12">
          <div className="flex items-center justify-center gap-2 sm:gap-8">
            <button
              type="button"
              onClick={() => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1))}
              className="shrink-0 w-11 h-11 sm:w-10 sm:h-10 rounded-full border border-border/60 flex items-center justify-center text-navy/60 hover:text-navy hover:border-navy/20 hover:bg-white/50 transition-colors"
              aria-label="Föregående utlåtande"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <blockquote className="flex-1 text-center min-w-0">
              <StarRating />
              <p
                className="text-base sm:text-xl md:text-2xl lg:text-3xl font-serif text-navy/90 leading-relaxed"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-4 sm:mt-6">
                <p className="text-sm sm:text-[15px] font-semibold text-navy">{t.author}</p>
                <p className="text-xs sm:text-[13px] text-gray-500">{t.role}</p>
              </footer>
            </blockquote>

            <button
              type="button"
              onClick={() => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1))}
              className="shrink-0 w-11 h-11 sm:w-10 sm:h-10 rounded-full border border-border/60 flex items-center justify-center text-navy/60 hover:text-navy hover:border-navy/20 hover:bg-white/50 transition-colors"
              aria-label="Nästa utlåtande"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-8" aria-hidden>
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === index ? "bg-navy" : "bg-navy/20 hover:bg-navy/40"}`}
                aria-label={`Utlåtande ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
