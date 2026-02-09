import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">L</span>
              </div>
              <span className="text-xl font-bold">Lokalportal</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sveriges ledande marknadsplats för kommersiella lokaler. Hitta rätt lokal snabbare.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Navigation</h4>
            <ul className="space-y-3">
              <li><Link href="/annonser" className="text-sm text-gray-400 hover:text-white transition-colors">Alla annonser</Link></li>
              <li><Link href="/kategorier" className="text-sm text-gray-400 hover:text-white transition-colors">Kategorier</Link></li>
              <li><Link href="/annonspaket" className="text-sm text-gray-400 hover:text-white transition-colors">Annonspaket</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Kategorier</h4>
            <ul className="space-y-3">
              <li><Link href="/annonser?category=butik" className="text-sm text-gray-400 hover:text-white transition-colors">Butikslokaler</Link></li>
              <li><Link href="/annonser?category=kontor" className="text-sm text-gray-400 hover:text-white transition-colors">Kontorslokaler</Link></li>
              <li><Link href="/annonser?category=lager" className="text-sm text-gray-400 hover:text-white transition-colors">Lagerlokaler</Link></li>
              <li><Link href="/annonser?category=ovrigt" className="text-sm text-gray-400 hover:text-white transition-colors">Övriga lokaler</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-gray-300">Kontakt</h4>
            <ul className="space-y-3">
              <li className="text-sm text-gray-400"><a href="mailto:info@lokalportal.se" className="hover:text-white transition-colors">info@lokalportal.se</a></li>
              <li className="text-sm text-gray-400">08-123 456 78</li>
              <li className="text-sm text-gray-400">Stockholm, Sverige</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Lokalportal. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/integritetspolicy" className="text-sm text-gray-500 hover:text-white transition-colors">Integritetspolicy</Link>
            <Link href="/villkor" className="text-sm text-gray-500 hover:text-white transition-colors">Villkor</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
