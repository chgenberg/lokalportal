"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Building2 } from "lucide-react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/annonser", label: "Alla annonser" },
    { href: "/kategorier", label: "Kategorier" },
    { href: "/annonspaket", label: "Annonspaket" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-navy rounded-lg flex items-center justify-center group-hover:bg-accent transition-colors">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-navy">Lokalportal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-navy transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/annonspaket"
              className="px-5 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors"
            >
              Annonsera
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-navy transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border animate-slide-down">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/annonspaket"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-4 bg-navy text-white text-sm font-medium rounded-lg text-center hover:bg-navy-light transition-colors"
            >
              Annonsera
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
