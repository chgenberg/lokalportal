import HeroSearch from "@/components/HeroSearch";
import HeroStats from "@/components/HeroStats";
import HeroCarousel from "@/components/HeroCarousel";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedListings from "@/components/FeaturedListings";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden min-h-[640px] md:min-h-[720px] flex items-center">
        <HeroCarousel />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pt-36 md:pb-32">
          <div className="text-center mb-12">
            <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-white/50 mb-4">
              Sveriges marknadsplats för kommersiella lokaler
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white mb-6 leading-[1.1] tracking-tight">
              Hitta rätt lokal
              <br />
              <span className="text-white/70">snabbare</span>
            </h1>
            <p className="text-base text-white/50 max-w-xl mx-auto leading-relaxed">
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
      <FeaturesSection />
      <CTASection />
    </>
  );
}
