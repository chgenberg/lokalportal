import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "Thomas och hans team hjälpte oss hitta kontor på rekordtid. Agenten skrev annonserna åt oss – sparade flera timmar.",
    author: "Maria K.",
    role: "Fastighetsförvaltare, Stockholm",
    initials: "MK",
  },
  {
    quote: "Vi fick fler seriösa förfrågningar på HittaYta än på någon annan plats. Thomas svarade personligen på alla våra frågor.",
    author: "Johan L.",
    role: "Hyresvärd, Göteborg",
    initials: "JL",
  },
  {
    quote: "Hittade ett kontor med 4 meters takhöjd – precis som Thomas lovade. Bra sökfilter och snabb kontakt med annonsören.",
    author: "Anna S.",
    role: "Företagare",
    initials: "AS",
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className="w-4 h-4 text-gold shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function SocialProofSection() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Vad andra säger</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Så upplever våra användare</h2>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.author} delay={i * 120}>
              <div className="bg-white rounded-2xl border border-border/60 p-6 shadow-sm transition-all duration-500 hover:border-navy/15 hover:shadow-md hover:-translate-y-1 relative">
                <span className="absolute top-6 left-6 text-6xl font-serif text-navy/[0.06] leading-none select-none" aria-hidden>&ldquo;</span>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-navy/[0.06] flex items-center justify-center shrink-0">
                    <span className="text-[13px] font-bold text-navy/70">{t.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <StarRating />
                    <p className="text-[15px] text-navy/90 leading-relaxed mt-3">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/40">
                  <p className="text-[13px] font-semibold text-navy">{t.author}</p>
                  <p className="text-[12px] text-gray-400">{t.role}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
