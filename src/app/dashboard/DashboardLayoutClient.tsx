"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isLandlord = session?.user?.role === "landlord";
  const currentTab = searchParams.get("tab");

  const navItems = [
    { href: "/dashboard", label: "Översikt", show: true },
    { href: "/dashboard/meddelanden", label: "Meddelanden", show: true },
    { href: "/dashboard?tab=listings", label: "Mina annonser", show: isLandlord },
    { href: "/dashboard?tab=favorites", label: "Favoriter", show: !isLandlord },
    { href: "/dashboard?tab=create", label: "Skapa annons", show: isLandlord },
    { href: "/dashboard?tab=settings", label: "Inställningar", show: true },
  ];

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-border p-4 sticky top-24">
              {session?.user && (
                <div className="pb-4 mb-4 border-b border-border">
                  <p className="font-semibold text-navy text-sm">{session.user.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{isLandlord ? "Hyresvärd" : "Hyresgäst"}</p>
                </div>
              )}
              <nav className="space-y-1">
                {navItems.filter((item) => item.show).map((item) => {
                  const itemTab = item.href.includes("tab=") ? item.href.match(/tab=([^&]+)/)?.[1] : null;
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/dashboard" && pathname === "/dashboard" && !currentTab) ||
                    (pathname === "/dashboard" && currentTab != null && itemTab === currentTab);
                  return (
                    <Link key={item.label} href={item.href} className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-navy text-white" : "text-gray-600 hover:bg-muted hover:text-navy"}`}>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
