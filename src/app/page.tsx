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
      {/* Hero Section with Carousel Background */}
      <section className="relative overflow-hidden min-h-[600px] md:min-h-[700px] flex items-center">
        {/* Carousel Background */}
        <HeroCarousel />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Hitta rätt lokal
              <br />
              <span className="text-accent-light">snabbare</span>
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 drop-shadow">
              Sveriges smartaste marknadsplats för kommersiella lokaler.
              Sök bland butiker, kontor, lager och mer.
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
