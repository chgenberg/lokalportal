const features = [
  { title: "Smart sökning", description: "Filtrera på stad, typ och kategori för att snabbt hitta exakt den lokal du letar efter." },
  { title: "Verifierade annonsörer", description: "Alla annonsörer verifieras med BankID för att säkerställa trygghet och kvalitet." },
  { title: "Snabb publicering", description: "Lägg upp din annons på under 5 minuter. Nå tusentals potentiella hyresgäster direkt." },
  { title: "Support & hjälp", description: "Vårt team finns tillgängligt för att hjälpa dig genom hela processen." },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Hur det fungerar</p>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Allt du behöver</h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-glow group py-10 px-6 bg-white rounded-2xl border border-border/60 cursor-default text-center glow-light"
            >
              <h3 className="text-base font-bold text-navy mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-[12px] text-gray-400 leading-relaxed max-w-[200px] mx-auto">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
