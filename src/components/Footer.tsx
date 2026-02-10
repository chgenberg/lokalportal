import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-navy text-white relative grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="mb-5">
              <Image
                src="/HYlogo.png"
                alt="Hittayta.se"
                width={140}
                height={40}
                className="h-9 w-auto object-contain brightness-0 invert opacity-80"
              />
            </div>
            <p className="text-[13px] text-white/30 leading-relaxed">
              Sveriges ledande marknadsplats för kommersiella lokaler.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/20">Navigation</h4>
            <ul className="space-y-3">
              <li><Link href="/annonser" className="text-[13px] text-white/40 hover:text-white transition-colors">Alla annonser</Link></li>
              <li><Link href="/kategorier" className="text-[13px] text-white/40 hover:text-white transition-colors">Kategorier</Link></li>
              <li><Link href="/annonspaket" className="text-[13px] text-white/40 hover:text-white transition-colors">Annonspaket</Link></li>
              <li><Link href="/karta" className="text-[13px] text-white/40 hover:text-white transition-colors">Karta</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/20">Företaget</h4>
            <ul className="space-y-3">
              <li><Link href="/om-oss" className="text-[13px] text-white/40 hover:text-white transition-colors">Om oss</Link></li>
              <li><Link href="/kontakt" className="text-[13px] text-white/40 hover:text-white transition-colors">Kontakta oss</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/20">Kontakt</h4>
            <ul className="space-y-3">
              <li><a href="mailto:info@ledigyta.se" className="text-[13px] text-white/40 hover:text-white transition-colors">info@ledigyta.se</a></li>
              <li className="text-[13px] text-white/40">Stockholm, Sverige</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/20">
            &copy; {new Date().getFullYear()} Hittayta.se
          </p>
          <div className="flex items-center gap-6">
            <Link href="/om-oss" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">Om oss</Link>
            <Link href="/integritetspolicy" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">Integritetspolicy</Link>
            <Link href="/cookies" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">Cookies</Link>
            <Link href="/villkor" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">Villkor</Link>
            <Link href="/kontakt" className="text-[12px] text-white/20 hover:text-white/50 transition-colors">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
