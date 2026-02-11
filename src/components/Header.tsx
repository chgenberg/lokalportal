"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import CreateListingModal from "./CreateListingModal";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

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

  const handleAnnonsera = () => {
    setShowCreateModal(true);
  };

  const isLandlord = session?.user?.role === "landlord";

  const navLinks = session?.user
    ? [
        { href: "/annonser", label: "Alla annonser" },
        { href: "/karta", label: "Karta" },
      ]
    : [
        { href: "/annonser", label: "Alla annonser" },
        { href: "/karta", label: "Karta" },
        { href: "/kategorier", label: "Kategorier" },
        { href: "/annonspaket", label: "Annonspaket" },
      ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass border-b border-border/60 shadow-sm"
            : "bg-white/0 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <Image
                src="/HYlogo.png"
                alt="Hittayta.se"
                width={200}
                height={60}
                className="h-10 sm:h-[52px] w-auto object-contain"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-navy rounded-lg hover:bg-navy/[0.03] transition-all duration-200 tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              {session?.user ? (
                <>
                  {isLandlord && (
                    <button
                      onClick={handleAnnonsera}
                      className="btn-glow px-5 py-2 bg-navy text-white text-[13px] font-semibold rounded-lg"
                    >
                      Annonsera
                    </button>
                  )}

                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      aria-label="Användarmenyn"
                      className="relative flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-border/60 hover:border-navy/20 hover:shadow-sm transition-all duration-200"
                    >
                      <span className="text-[13px] font-medium text-navy hidden lg:inline">
                        {session.user.name}
                      </span>
                      <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white tracking-wide">
                          {session.user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-border/60 shadow-xl py-1.5 animate-scale-in">
                        <div className="px-4 py-2.5 border-b border-border/60">
                          <p className="text-sm font-semibold text-navy">{session.user.name}</p>
                          <p className="text-[11px] text-gray-400 tracking-wide">
                            {isLandlord ? "Hyresvärd" : "Hyresgäst"}
                          </p>
                        </div>
                        <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-[13px] text-gray-500 hover:text-navy hover:bg-navy/[0.03] transition-all">
                          Dashboard
                        </Link>
                        <Link href="/dashboard/meddelanden" onClick={() => setUserMenuOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-[13px] text-gray-500 hover:text-navy hover:bg-navy/[0.03] transition-all">
                          Meddelanden
                          {unreadCount > 0 && (
                            <span className="w-5 h-5 bg-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                          )}
                        </Link>
                        <Link href="/dashboard?tab=settings" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-[13px] text-gray-500 hover:text-navy hover:bg-navy/[0.03] transition-all">
                          Inställningar
                        </Link>
                        <div className="border-t border-border/60 mt-1 pt-1">
                          <button
                            onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                            className="block w-full text-left px-4 py-2.5 text-[13px] text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-all"
                          >
                            Logga ut
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/logga-in" className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-navy rounded-lg hover:bg-navy/[0.03] transition-all">
                    Logga in
                  </Link>
                  <button
                    onClick={handleAnnonsera}
                    className="btn-glow px-5 py-2 bg-navy text-white text-[13px] font-semibold rounded-lg"
                  >
                    Annonsera
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-navy transition-colors"
              aria-label="Meny"
            >
              <span className="text-xl">{mobileOpen ? "\u00D7" : "\u2261"}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden glass border-t border-border/60 animate-slide-down">
            <div className="px-4 py-4 space-y-0.5">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block py-2.5 px-4 text-sm font-medium text-gray-500 hover:text-navy hover:bg-navy/[0.03] rounded-lg transition-all">
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border/60 pt-3 mt-3">
                {session?.user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block py-2.5 px-4 text-sm font-medium text-gray-500 hover:text-navy hover:bg-navy/[0.03] rounded-lg transition-all">Dashboard</Link>
                    <Link href="/dashboard/meddelanden" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-2.5 px-4 text-sm font-medium text-gray-500 hover:text-navy hover:bg-navy/[0.03] rounded-lg transition-all">
                      Meddelanden
                      {unreadCount > 0 && <span className="w-5 h-5 bg-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
                    </Link>
                    {isLandlord && (
                      <button
                        onClick={() => { setMobileOpen(false); handleAnnonsera(); }}
                        className="block w-full py-2.5 px-4 bg-navy text-white text-sm font-semibold rounded-lg text-center mt-2"
                      >
                        Annonsera
                      </button>
                    )}
                    <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }} className="block w-full text-left py-2.5 px-4 text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-lg transition-all mt-1">Logga ut</button>
                  </>
                ) : (
                  <>
                    <Link href="/logga-in" onClick={() => setMobileOpen(false)} className="block py-2.5 px-4 text-sm font-medium text-gray-500 hover:text-navy hover:bg-navy/[0.03] rounded-lg transition-all">Logga in</Link>
                    <button
                      onClick={() => { setMobileOpen(false); handleAnnonsera(); }}
                      className="block w-full py-2.5 px-4 bg-navy text-white text-sm font-semibold rounded-lg text-center mt-2"
                    >
                      Annonsera
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <CreateListingModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </>
  );
}
