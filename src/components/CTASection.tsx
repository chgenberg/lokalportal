import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-navy rounded-3xl overflow-hidden glow-strong grain">
          {/* Subtle geometric accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.02] rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/[0.015] rounded-full translate-y-1/2 -translate-x-1/3" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.01] rounded-full" />

          <div className="relative z-10 px-8 py-20 md:px-16 md:py-24 text-center">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/25 mb-4">For fastighetsagare</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Hyr ut din lokal</h2>
            <p className="text-base text-white/40 mb-10 max-w-lg mx-auto leading-relaxed">
              Na tusentals potentiella hyresgaster. Logga in sakert med BankID och publicera din annons idag.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/logga-in" className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 bg-white text-navy font-semibold rounded-xl text-sm tracking-wide">
                Logga in med BankID
              </Link>
              <Link href="/annonspaket" className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/[0.05] hover:text-white transition-all text-sm tracking-wide">
                Se annonspaket &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
