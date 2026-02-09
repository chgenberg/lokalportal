const features = [
  { title: "Smart sokning", description: "Filtrera pa stad, typ och kategori for att snabbt hitta exakt den lokal du letar efter." },
  { title: "Verifierade annonsorer", description: "Alla annonsorer verifieras med BankID for att sakerst\u00e4lla trygghet och kvalitet." },
  { title: "Snabb publicering", description: "Lagg upp din annons pa under 5 minuter. Na tusentals potentiella hyresgaster direkt." },
  { title: "Support & hjalp", description: "Vart team finns tillgangligt for att hjalpa dig genom hela processen." },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Hur det fungerar</p>
          <h2 className="text-3xl font-bold text-navy tracking-tight">Allt du behover</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="card-glow group p-7 bg-white rounded-2xl border border-border/60 cursor-default glow-light"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <div className="w-10 h-10 mb-5 rounded-xl bg-navy/[0.04] flex items-center justify-center group-hover:bg-navy transition-all duration-300">
                <span className="text-[13px] font-bold text-navy/60 group-hover:text-white transition-colors tabular-nums">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-navy mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
