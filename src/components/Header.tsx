"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  Building2,
  Map,
  User,
  LogOut,
  MessageCircle,
  LayoutDashboard,
} from "lucide-react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();

  // Fetch unread count periodically
  useEffect(() => {
    if (!session?.user) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/messages/conversations?unreadOnly=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [session]);

  const navLinks = [
    { href: "/annonser", label: "Alla annonser" },
    { href: "/karta", label: "Karta", icon: Map },
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
                className="text-sm font-medium text-gray-600 hover:text-navy transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all hover:after:w-full flex items-center gap-1.5"
              >
                {link.icon && <link.icon className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <>
                {/* Messages */}
                <Link
                  href="/dashboard/meddelanden"
                  className="relative p-2 text-gray-600 hover:text-navy transition-colors"
                  aria-label="Meddelanden"
                >
                  <MessageCircle className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dashboard */}
                <Link
                  href="/dashboard"
                  className="p-2 text-gray-600 hover:text-navy transition-colors"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>

                {/* User menu */}
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
                        <p className="text-sm font-medium text-navy">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.user.role === "landlord"
                            ? "Hyresvärd"
                            : "Hyresgäst"}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/meddelanden"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-muted transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Meddelanden
                        {unreadCount > 0 && (
                          <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logga ut
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/logga-in"
                  className="text-sm font-medium text-gray-600 hover:text-navy transition-colors flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  Logga in
                </Link>
                <Link
                  href="/annonspaket"
                  className="px-5 py-2.5 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors"
                >
                  Annonsera
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-navy transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
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
                className="flex items-center gap-2 py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors"
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}

            <div className="border-t border-border pt-3">
              {session?.user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/meddelanden"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Meddelanden
                    {unreadCount > 0 && (
                      <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logga ut
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/logga-in"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 py-2.5 px-4 text-sm font-medium text-gray-600 hover:text-navy hover:bg-muted rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Logga in
                  </Link>
                  <Link
                    href="/annonspaket"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 px-4 bg-navy text-white text-sm font-medium rounded-lg text-center hover:bg-navy-light transition-colors"
                  >
                    Annonsera
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
