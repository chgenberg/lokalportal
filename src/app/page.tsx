import Link from "next/link";
import HeroSearch from "@/components/HeroSearch";
import HeroStats from "@/components/HeroStats";
import HeroCarousel from "@/components/HeroCarousel";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedListings from "@/components/FeaturedListings";
import FeaturesSection from "@/components/FeaturesSection";
import SocialProofSection from "@/components/SocialProofSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden min-h-[640px] md:min-h-[720px] flex items-center">
        <HeroCarousel />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pt-36 md:pb-32">
          <div className="text-center mb-12">
            <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-white mb-4">
              Sveriges marknadsplats för kommersiella lokaler
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Hitta rätt lokal
              <br />
              <span className="text-white">snabbare</span>
            </h1>
            <p className="text-base text-white max-w-xl mx-auto leading-relaxed">
              Sök bland butiker, kontor, lager och unika ytor.
              Verifierade annonsörer. Trygga affärer.
            </p>
          </div>

          <HeroSearch />
          <HeroStats />
        </div>
      </section>

      <CategoriesSection />
      <FeaturedListings />

      <section className="py-20 bg-white border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">Testa vårt AI-verktyg</p>
          <h2 className="text-2xl md:text-3xl font-bold text-navy tracking-tight mb-3">Skapa en professionell annons på minuter</h2>
          <p className="text-[13px] text-gray-500 max-w-lg mx-auto mb-8">
            Ange din e-post och grunduppgifter – vår AI genererar en säljande annonstext som du laddar ner som PDF. Ingen registrering krävs.
          </p>
          <Link
            href="/skapa-annons"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy/90 transition-colors tracking-wide"
          >
            Skapa gratis annons-PDF
          </Link>
        </div>
      </section>

      <FeaturesSection />
      <SocialProofSection />
      <CTASection />
    </>
  );
}
