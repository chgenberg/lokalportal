import ScrollReveal from "./ScrollReveal";

const testimonials = [
  {
    quote: "Thomas och hans team hjälpte oss hitta kontor på rekordtid. AI-verktyget skrev annonserna åt oss – sparade flera timmar.",
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
              <div className="bg-white rounded-2xl border border-border/60 p-6 shadow-sm transition-all duration-500 hover:border-navy/15 hover:shadow-md hover:-translate-y-1">
                <p className="text-[15px] text-navy/90 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
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
