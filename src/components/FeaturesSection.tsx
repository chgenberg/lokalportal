const features = [
  {
    title: "Smart sökning",
    description: "Filtrera på stad, typ och kategori för att snabbt hitta exakt den lokal du letar efter.",
  },
  {
    title: "Verifierade annonser",
    description: "Alla annonsörer verifieras med BankID för att säkerställa trygghet och kvalitet.",
  },
  {
    title: "Snabb publicering",
    description: "Lägg upp din annons på under 5 minuter. Nå tusentals potentiella hyresgäster direkt.",
  },
  {
    title: "Support & hjälp",
    description: "Vårt team finns tillgängligt för att hjälpa dig genom hela processen.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-navy mb-3">Allt du behöver</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Vi gör det enkelt att hitta, jämföra och hyra kommersiella lokaler
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group p-8 bg-white rounded-2xl border border-border hover:border-navy/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <div className="w-10 h-10 mb-5 rounded-xl bg-navy/5 flex items-center justify-center text-lg font-bold text-navy group-hover:bg-navy group-hover:text-white transition-all duration-300">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
