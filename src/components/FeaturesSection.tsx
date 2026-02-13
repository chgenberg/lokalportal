import ScrollReveal from "./ScrollReveal";

const SearchIcon = () => (
  <svg className="w-8 h-8 text-navy/50 group-hover:text-navy/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="w-8 h-8 text-navy/50 group-hover:text-navy/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);
const LightningIcon = () => (
  <svg className="w-8 h-8 text-navy/50 group-hover:text-navy/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);
const HeartIcon = () => (
  <svg className="w-8 h-8 text-navy/50 group-hover:text-navy/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const iconMap = { search: SearchIcon, shield: ShieldIcon, lightning: LightningIcon, heart: HeartIcon };

const features = [
  { title: "Smart sökning", description: "Filtrera på stad, typ och kategori för att snabbt hitta exakt den lokal du letar efter.", icon: "search" as const },
  { title: "Verifierade annonsörer", description: "Alla annonsörer verifieras med BankID för att säkerställa trygghet och kvalitet.", icon: "shield" as const },
  { title: "Snabb publicering", description: "Lägg upp din annons på under 5 minuter. Nå tusentals potentiella hyresgäster direkt.", icon: "lightning" as const },
  { title: "Support & hjälp", description: "Vårt team finns tillgängligt för att hjälpa dig genom hela processen.", icon: "heart" as const },
];

export default function FeaturesSection() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Hur det fungerar</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">Allt du behöver</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 100}>
              <div className="group py-6 sm:py-10 px-4 sm:px-6 bg-white rounded-2xl border border-border/60 cursor-default text-center transition-all duration-500 hover:border-navy/15 hover:shadow-md hover:-translate-y-1">
                <div className="flex justify-center mb-4">
                  {(() => {
                    const Icon = iconMap[feature.icon];
                    return Icon ? <Icon /> : null;
                  })()}
                </div>
                <h3 className="text-base font-bold text-navy mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-[12px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
