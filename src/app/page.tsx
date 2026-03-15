import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedListings from "@/components/FeaturedListings";
import FeaturesSection from "@/components/FeaturesSection";
import SocialProofSection from "@/components/SocialProofSection";
import CTASection from "@/components/CTASection";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://offmarket.nu";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Offmarket.nu",
  url: siteUrl,
  description: "Sveriges marknadsplats för off-market bostäder till salu.",
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
      <HeroSection />
      <CategoriesSection />
      <FeaturedListings />
      <FeaturesSection />
      <SocialProofSection />
      <CTASection />
    </>
  );
}
