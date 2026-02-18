import Image from "next/image";
import HeroSearch from "@/components/HeroSearch";
import HeroStats from "@/components/HeroStats";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedListings from "@/components/FeaturedListings";
import FeaturesSection from "@/components/FeaturesSection";
import SocialProofSection from "@/components/SocialProofSection";
import CTASection from "@/components/CTASection";

const HERO_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hittayta.se";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "HittaYta.se",
  url: siteUrl,
  description: "Sveriges ledande marknadsplats för kommersiella lokaler.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/annonser?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <section className="bg-white py-14 sm:py-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-3">
                Sveriges marknadsplats för kommersiella lokaler
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy leading-[1.1] tracking-tight mb-4">
                Hitta rätt lokal snabbare
              </h1>
              <p className="text-base text-gray-600 max-w-lg leading-relaxed mb-8">
                Sök bland butiker, kontor, lager och unika ytor.
                Verifierade annonsörer. Trygga affärer.
              </p>
              <HeroSearch />
            </div>
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
              <Image
                src={HERO_IMAGE}
                alt="Moderna kontorsytor och kommersiella lokaler"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy py-12 sm:py-16" aria-label="Statistik">
        <HeroStats />
      </section>
      <CategoriesSection />
      <FeaturedListings />
      <FeaturesSection />
      <SocialProofSection />
      <CTASection />
    </>
  );
}
