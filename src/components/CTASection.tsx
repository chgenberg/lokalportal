import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const CTA_LOCAL_IMG = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80";
const CTA_OWNER_IMG = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80";

export default function CTASection() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <ScrollReveal>
            <Link
              href="/annonser"
              className="group block relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[360px] shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Image
                src={CTA_LOCAL_IMG}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-1.5 sm:mb-2 tracking-tight">
                  Hitta rätt lokal snabbare
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mb-4 sm:mb-6 max-w-sm">
                  Sök bland butiker, kontor, lager och unika ytor. Verifierade annonsörer.
                </p>
                <span className="inline-flex items-center gap-2 w-fit px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-navy text-xs sm:text-sm font-semibold rounded-full transition-all group-hover:bg-white/95">
                  Sök lokaler
                </span>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <Link
              href="/skapa-annons"
              className="group block relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[260px] sm:min-h-[360px] shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <Image
                src={CTA_OWNER_IMG}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-navy/75" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8">
                <h2 className="text-lg sm:text-2xl font-bold text-white mb-1.5 sm:mb-2 tracking-tight">
                  Skapa en professionell annons på minuter
                </h2>
                <p className="text-xs sm:text-sm text-white/80 mb-4 sm:mb-6 max-w-sm">
                  Ange grunduppgifter – vår agent genererar en säljande annonstext. Ingen registrering krävs.
                </p>
                <span className="inline-flex items-center gap-2 w-fit px-4 sm:px-5 py-2 sm:py-2.5 bg-gold text-navy text-xs sm:text-sm font-semibold rounded-full transition-all group-hover:brightness-105">
                  Skapa annons
                </span>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
