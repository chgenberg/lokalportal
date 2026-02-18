import Link from "next/link";
import Image from "next/image";
import NewsletterSignup from "./NewsletterSignup";

export default function Footer() {
  return (
    <footer className="bg-navy text-white relative">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 sm:gap-14">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-5">
              <Image
                src="/HYlogo.png"
                alt="Hittayta.se"
                width={140}
                height={40}
                className="h-9 w-auto object-contain brightness-0 invert opacity-80"
              />
            </div>
            <p className="text-[13px] text-white/40 leading-relaxed mb-6">
              Sveriges marknadsplats för kommersiella lokaler.
            </p>
            <NewsletterSignup />
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/30">Navigation</h4>
            <ul className="space-y-3">
              <li><Link href="/annonser" className="text-[13px] text-white/50 hover:text-white transition-colors">Alla annonser</Link></li>
              <li><Link href="/kategorier" className="text-[13px] text-white/50 hover:text-white transition-colors">Kategorier</Link></li>
              <li><Link href="/skapa-annons" className="text-[13px] text-white/50 hover:text-white transition-colors">Skapa annons</Link></li>
              <li><Link href="/sa-hyr-du-ut-en-lokal" className="text-[13px] text-white/50 hover:text-white transition-colors">Så hyr du ut en lokal</Link></li>
              <li><Link href="/karta" className="text-[13px] text-white/50 hover:text-white transition-colors">Karta</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/30">Företaget</h4>
            <ul className="space-y-3">
              <li><Link href="/om-oss" className="text-[13px] text-white/50 hover:text-white transition-colors">Om oss</Link></li>
              <li><Link href="/kontakt" className="text-[13px] text-white/50 hover:text-white transition-colors">Kontakta oss</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] mb-5 text-white/30">Kontakt</h4>
            <ul className="space-y-3">
              <li><a href="mailto:info@hittayta.se" className="text-[13px] text-white/50 hover:text-white transition-colors duration-200">info@hittayta.se</a></li>
              <li className="text-[13px] text-white/50">Stockholm, Sverige</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="https://www.linkedin.com/company/hittayta" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://www.instagram.com/hittayta" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.08] mt-16 pt-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-white/30">
            &copy; {new Date().getFullYear()} Hittayta.se
          </p>
          <div className="flex items-center flex-wrap gap-x-6 gap-y-2">
            <Link href="/om-oss" className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200">Om oss</Link>
            <Link href="/integritetspolicy" className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200">Integritetspolicy</Link>
            <Link href="/cookies" className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200">Cookies</Link>
            <Link href="/villkor" className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200">Villkor</Link>
            <Link href="/kontakt" className="text-[12px] text-white/30 hover:text-white/60 transition-colors duration-200">Kontakt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
