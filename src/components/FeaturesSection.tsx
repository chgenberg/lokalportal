import ScrollReveal from "./ScrollReveal";

const features = [
  {
    title: "Verifierade annonsörer",
    description: "Alla annonsörer verifieras med BankID för att säkerställa trygghet och kvalitet.",
    bgClass: "bg-[#FFF8ED]",
    icon: (
      <svg className="w-10 h-10 text-navy/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
  },
  {
    title: "Snabb publicering",
    description: "Lägg upp din annons på under 5 minuter. Nå tusentals potentiella hyresgäster direkt.",
    bgClass: "bg-[#E8F4FD]",
    icon: (
      <svg className="w-10 h-10 text-navy/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
    ),
  },
  {
    title: "Support & hjälp",
    description: "Vårt team finns tillgängligt för att hjälpa dig genom hela processen.",
    bgClass: "bg-[#F0F9F0]",
    icon: (
      <svg className="w-10 h-10 text-navy/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
              Hitta lokal med HittaYta och känn dig trygg
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 80}>
              <div
                className={`group py-8 sm:py-10 px-6 sm:px-8 rounded-3xl cursor-default text-center transition-all duration-300 hover:shadow-lg ${feature.bgClass}`}
              >
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-navy mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
