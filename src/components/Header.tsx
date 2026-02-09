"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/messages/conversations?unreadOnly=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [session]);

  const navLinks = [
    { href: "/annonser", label: "Alla annonser" },
    { href: "/karta", label: "Karta" },
    { href: "/kategorier", label: "Kategorier" },
    { href: "/annonspaket", label: "Annonspaket" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/logohittayta.jpeg"
              alt="Hittayta.se"
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-navy transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-navy after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard/meddelanden"
                  className="relative px-3 py-2 text-sm font-medium text-gray-600 hover:text-navy transition-colors"
                >
                  Meddelanden
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-navy transition-colors"
                >
                  Dashboard
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-navy hidden lg:inline">
                      {session.user.name}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-border shadow-lg py-2 animate-slide-down">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium text-navy">{session.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {session.user.role === "landlord" ? "Hyresvärd" : "Hyresgäst"}
                        </p>
                      </div>
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-muted transition-colors">
                        Dashboard
                      </Link>
                      <Link href="/dashboard/meddelanden" onClick={() => setUserMenuOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 hover:bg-muted transition-colors">
                        Meddelanden
                        {unreadCount > 0 && (
                          <span className="w-5 h-5 bg-navy text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                        )}
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-muted transition-colors"
                      >
                        Logga ut
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/logga-in" className="text-sm font-medium text-gray-600 hover:text-navy transition-colors">
                  Logga in
                </Link>
                <Link href="/annonspaket" className="px-5 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">
                  Annonsera
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-navy transition-colors"
            aria-label="Meny"
          >
            <span className="text-xl">{mobileOpen ? "\u00D7" : "\u2261"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors">
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border pt-3 mt-3">
              {session?.user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors">Dashboard</Link>
                  <Link href="/dashboard/meddelanden" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors">
                    Meddelanden
                    {unreadCount > 0 && <span className="w-5 h-5 bg-navy text-white text-xs font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
                  </Link>
                  <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }} className="block w-full text-left py-2.5 px-4 text-sm font-medium text-gray-600 hover:bg-muted rounded-lg transition-colors">Logga ut</button>
                </>
              ) : (
                <>
                  <Link href="/logga-in" onClick={() => setMobileOpen(false)} className="block py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors">Logga in</Link>
                  <Link href="/annonspaket" onClick={() => setMobileOpen(false)} className="block py-2.5 px-4 bg-navy text-white text-sm font-medium rounded-lg text-center hover:bg-navy-light transition-colors mt-2">Annonsera</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
