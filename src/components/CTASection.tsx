import Link from "next/link";
import Image from "next/image";
import ScrollReveal from "./ScrollReveal";

const CTA_BG = "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80";

export default function CTASection() {
  return (
    <section className="py-14 sm:py-20 md:py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="relative rounded-3xl overflow-hidden min-h-[380px] grain-overlay">
            <Image
              src={CTA_BG}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority={false}
            />
            <div className="absolute inset-0 bg-navy/80" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/[0.02] rounded-full translate-y-1/2 -translate-x-1/3" />

            <div className="relative z-10 min-h-[320px] flex flex-col items-center justify-center px-6 py-12 sm:px-8 sm:py-16 md:px-16 md:py-24 text-center">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/25 mb-4">För fastighetsägare</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Hyr ut din lokal</h2>
              <p className="text-base text-white/40 mb-10 max-w-lg mx-auto leading-relaxed">
                Nå tusentals potentiella hyresgäster. Logga in säkert med BankID och publicera din annons idag.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
                <Link href="/skapa-annons" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold text-navy font-semibold rounded-xl text-sm tracking-wide transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  Skapa annons
                </Link>
                <Link href="/logga-in" className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 text-white/70 font-medium rounded-xl hover:bg-white/[0.05] hover:text-white transition-all duration-200 text-sm tracking-wide">
                  Logga in
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
