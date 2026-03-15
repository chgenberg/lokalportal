"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<{ id: string; type: string; message: string; createdAt: string; read: boolean }[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

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
        const [msgRes, notifRes] = await Promise.all([
          fetch("/api/messages/conversations?unreadOnly=true"),
          fetch("/api/notifications?unreadOnly=true&limit=10"),
        ]);
        if (msgRes.ok) {
          const data = await msgRes.json();
          setUnreadCount(data.unreadCount || 0);
        }
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotificationCount(data.unreadCount || 0);
          setNotifications(data.notifications || []);
        }
      } catch { /* silent */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notifOpen]);

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) });
      setNotificationCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const isSeller = session?.user?.isSeller;
  const isAdmin = session?.user?.isAdmin;

  const navLinks = session?.user
    ? [
        { href: "/annonser", label: "Alla annonser" },
        { href: "/karta", label: "Karta" },
        { href: "/sa-hyr-du-ut-en-lokal", label: "Så fungerar det" },
        { href: "/dashboard", label: "Dashboard" },
      ]
    : [
        { href: "/annonser", label: "Alla annonser" },
        { href: "/karta", label: "Karta" },
        { href: "/sa-hyr-du-ut-en-lokal", label: "Så fungerar det" },
        { href: "/kategorier", label: "Kategorier" },
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
            <div className="flex items-center justify-between h-14 sm:h-[72px]">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <Image
                src="/HYlogo.png"
                alt="Offmarket"
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
                  <Link
                    href="/skapa-annons"
                    className="px-5 py-2 bg-navy text-white text-[13px] font-semibold rounded-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    Annonsera
                  </Link>

                  {/* Notification bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(!notifOpen)}
                      aria-label="Notifikationer"
                      className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-navy/[0.04] transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                      {notificationCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {notificationCount}
                        </span>
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-border/60 shadow-xl py-1.5 animate-scale-in z-50">
                        <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
                          <p className="text-sm font-semibold text-navy">Notifikationer</p>
                          {notificationCount > 0 && (
                            <button type="button" onClick={markAllNotificationsRead} className="text-[11px] text-navy/50 hover:text-navy transition-colors">
                              Markera alla som lästa
                            </button>
                          )}
                        </div>
                        {notifications.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-gray-400 text-center">Inga notifikationer</p>
                        ) : (
                          <div className="max-h-80 overflow-y-auto">
                            {notifications.map((n) => (
                              <div key={n.id} className={`px-4 py-3 border-b border-border/20 last:border-0 ${!n.read ? "bg-navy/[0.02]" : ""}`}>
                                <p className="text-[13px] text-gray-700">{n.message}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                  {new Date(n.createdAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
                      <div className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-border/60 shadow-xl py-1.5 animate-scale-in">
                        <div className="px-4 py-2.5 border-b border-border/60">
                          <p className="text-sm font-semibold text-navy">{session.user.name}</p>
                          <p className="text-[11px] text-gray-400 tracking-wide">
                            {isSeller ? "Säljare" : "Köpare"}
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
                        {isAdmin && (
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-[13px] text-gray-500 hover:text-navy hover:bg-navy/[0.03] transition-all">
                            Admin
                          </Link>
                        )}
                        <div className="border-t border-border/60 mt-1 pt-1">
                          <button
                            onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: window.location.origin + "/logga-in" }); }}
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
                  <Link href="/logga-in" className="px-4 py-2 text-[13px] font-medium text-gray-500 hover:text-navy rounded-full hover:bg-navy/[0.03] transition-all">
                    Logga in
                  </Link>
                  <Link
                    href="/skapa-annons"
                    className="px-5 py-2 bg-navy text-white text-[13px] font-semibold rounded-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    Annonsera
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 text-gray-500 hover:text-navy transition-colors rounded-lg"
              aria-label="Meny"
            >
              <span className="text-2xl">{mobileOpen ? "\u00D7" : "\u2261"}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden glass border-t border-border/60 animate-slide-down shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="px-4 py-3 space-y-0.5">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center py-3.5 px-4 text-[15px] font-medium text-gray-600 hover:text-navy active:bg-navy/[0.04] rounded-xl transition-all">
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border/60 pt-3 mt-2">
                {session?.user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center py-3 px-4 text-[15px] font-medium text-gray-600 hover:text-navy active:bg-navy/[0.04] rounded-xl transition-all">Dashboard</Link>
                    <Link href="/dashboard/meddelanden" onClick={() => setMobileOpen(false)} className="flex items-center justify-between py-3 px-4 text-[15px] font-medium text-gray-600 hover:text-navy active:bg-navy/[0.04] rounded-xl transition-all">
                      Meddelanden
                      {unreadCount > 0 && <span className="w-5 h-5 bg-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>}
                    </Link>
                    <Link href="/skapa-annons" onClick={() => setMobileOpen(false)} className="block w-full py-3 px-4 bg-navy text-white text-[15px] font-semibold rounded-full text-center mt-3">
                      Annonsera
                    </Link>
                    <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: window.location.origin + "/logga-in" }); }} className="block w-full text-left py-3 px-4 text-[15px] font-medium text-gray-400 hover:text-red-500 active:bg-red-50/50 rounded-xl transition-all mt-1">Logga ut</button>
                  </>
                ) : (
                  <>
                    <Link href="/logga-in" onClick={() => setMobileOpen(false)} className="flex items-center py-3 px-4 text-[15px] font-medium text-gray-600 hover:text-navy active:bg-navy/[0.04] rounded-xl transition-all">Logga in</Link>
                    <Link href="/skapa-annons" onClick={() => setMobileOpen(false)} className="block w-full py-3 px-4 bg-navy text-white text-[15px] font-semibold rounded-full text-center mt-3">
                      Annonsera
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
