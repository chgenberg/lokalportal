import HeroSearch from "@/components/HeroSearch";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedListings from "@/components/FeaturedListings";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-navy/3 rounded-full translate-y-1/2 translate-x-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy mb-6 leading-tight">
              Hitta rätt lokal
              <br />
              <span className="text-accent">snabbare</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
              Sveriges smartaste marknadsplats för kommersiella lokaler.
              Sök bland butiker, kontor, lager och mer.
            </p>
          </div>

          <HeroSearch />

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-navy">500+</div>
              <div className="text-sm text-gray-500 mt-1">Lokaler</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-navy">50+</div>
              <div className="text-sm text-gray-500 mt-1">Städer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-navy">1000+</div>
              <div className="text-sm text-gray-500 mt-1">Nöjda kunder</div>
            </div>
          </div>
        </div>
      </section>

      <CategoriesSection />
      <FeaturedListings />
      <FeaturesSection />
      <CTASection />
    </>
  );
}
