import { Search, Shield, Zap, HeadphonesIcon } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Smart sökning",
    description:
      "Filtrera på stad, typ och kategori för att snabbt hitta exakt den lokal du letar efter.",
  },
  {
    icon: Shield,
    title: "Verifierade annonser",
    description:
      "Alla annonsörer verifieras med BankID för att säkerställa trygghet och kvalitet.",
  },
  {
    icon: Zap,
    title: "Snabb publicering",
    description:
      "Lägg upp din annons på under 5 minuter. Nå tusentals potentiella hyresgäster direkt.",
  },
  {
    icon: HeadphonesIcon,
    title: "Support & hjälp",
    description:
      "Vårt team finns tillgängligt för att hjälpa dig genom hela processen.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-navy mb-3">
            Allt du behöver
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Vi gör det enkelt att hitta, jämföra och hyra kommersiella lokaler
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-navy/5 flex items-center justify-center group-hover:bg-navy group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-navy group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
