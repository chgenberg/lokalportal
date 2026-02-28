"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

/* ── SVG icon components (inline, no deps) ─────────────── */

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22V18h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

/* ── Layout ────────────────────────────────────────────── */

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isLandlord = session?.user?.role === "landlord" || session?.user?.role === "agent";
  const currentTab = searchParams.get("tab");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Översikt", icon: IconHome, show: true },
    { href: "/dashboard/meddelanden", label: "Meddelanden", icon: IconChat, show: true },
    { href: "/dashboard?tab=listings", label: "Mina annonser", icon: IconBuilding, show: isLandlord },
    { href: "/dashboard?tab=favorites", label: "Favoriter", icon: IconHeart, show: !isLandlord },
    { href: "/dashboard?tab=statistics", label: "Statistik", icon: IconChart, show: isLandlord },
    { href: "/skapa-annons", label: "Ny annons", icon: IconPlus, show: true },
    { href: "/dashboard?tab=settings", label: "Inställningar", icon: IconSettings, show: true },
  ];

  const getIsActive = (item: (typeof navItems)[0]) => {
    const itemTab = item.href.includes("tab=") ? item.href.match(/tab=([^&]+)/)?.[1] : null;
    return (
      (item.href === "/dashboard/meddelanden" && pathname.startsWith("/dashboard/meddelanden")) ||
      (item.href === "/dashboard" && pathname === "/dashboard" && !currentTab && !itemTab) ||
      (pathname === "/dashboard" && currentTab != null && itemTab === currentTab)
    );
  };

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const sidebar = (
    <>
      {/* Profile */}
      {session?.user && (
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-navy/8 flex items-center justify-center text-navy text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-navy text-sm truncate">{session.user.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{session?.user?.role === "agent" ? "Mäklare" : isLandlord ? "Hyresvärd / säljare" : "Hyresgäst / köpare"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-border/60" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const active = getIsActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-navy text-white shadow-sm"
                    : "text-gray-500 hover:text-navy hover:bg-navy/[0.04]"
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors duration-150 ${
                    active ? "text-white" : "text-gray-400 group-hover:text-navy"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-border/60" />

      {/* Logout */}
      <div className="px-3 py-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="group flex items-center gap-3 w-full px-3 py-3 rounded-2xl text-[13px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-200"
        >
          <IconLogout className="w-[18px] h-[18px] shrink-0 text-gray-300 group-hover:text-red-400 transition-colors duration-150" />
          Logga ut
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between mb-5 bg-white rounded-3xl border border-border/40 shadow-sm px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-navy/8 flex items-center justify-center text-navy text-xs font-bold">
              {initials}
            </div>
            <p className="text-sm font-semibold text-navy">{session?.user?.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex items-center justify-center w-11 h-11 -mr-1 rounded-2xl text-gray-500 hover:text-navy hover:bg-navy/[0.04] transition-all duration-200"
            aria-label={mobileOpen ? "Stäng meny" : "Öppna meny"}
          >
            {mobileOpen ? <IconX className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="lg:hidden mb-5 bg-white rounded-3xl border border-border/40 shadow-lg overflow-hidden animate-slide-down">
            {sidebar}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-white rounded-3xl border border-border/40 shadow-sm sticky top-24 overflow-hidden flex flex-col">
              {sidebar}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
