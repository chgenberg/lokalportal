import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-navy rounded-3xl overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Hyr ut din lokal
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Nå tusentals potentiella hyresgäster. Logga in säkert med BankID
              och publicera din annons idag.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/annonspaket"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-navy font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Shield className="w-5 h-5" />
                Logga in med BankID
              </Link>
              <Link
                href="/annonspaket"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                Se annonspaket
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
