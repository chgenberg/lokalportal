"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  isBuyer: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  bankIdVerified: boolean;
  subscriptionTier: string;
  createdAt: string;
  listingCount: number;
  favoriteCount: number;
  profileCount: number;
};

type AdminListing = {
  id: string;
  title: string;
  city: string;
  propertyType: string;
  price: number;
  status: string;
  featured: boolean;
  ownershipVerified: boolean;
  viewCount: number;
  createdAt: string;
  owner: { name: string; email: string; bankIdVerified: boolean } | null;
  conversationCount: number;
  favoriteCount: number;
};

type AdminStats = {
  users: { total: number; newThisWeek: number; newThisMonth: number; verified: number; premium: number; byRole: Record<string, number> };
  listings: { total: number; active: number; sold: number };
  engagement: { conversations: number; messages: number; matches: number; activeBuyerProfiles: number };
};

function AdminContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");

  useEffect(() => {
    if (!session?.user?.isAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === "overview") {
          const res = await fetch("/api/admin/stats");
          if (res.ok) setStats(await res.json());
        } else if (tab === "users") {
          const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
          if (res.ok) { const data = await res.json(); setUsers(data.users); }
        } else if (tab === "listings") {
          const res = await fetch(`/api/admin/listings?search=${encodeURIComponent(listingSearch)}`);
          if (res.ok) { const data = await res.json(); setListings(data.listings); }
        }
      } catch { /* */ }
      setLoading(false);
    };
    fetchData();
  }, [session, tab, userSearch, listingSearch]);

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Ej behörig</p>
      </div>
    );
  }

  const handleUserAction = async (userId: string, action: string) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) {
      const search = userSearch;
      setUserSearch("");
      setTimeout(() => setUserSearch(search), 0);
    }
  };

  const handleListingAction = async (listingId: string, action: string, status?: string) => {
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action, status }),
    });
    if (res.ok) {
      const search = listingSearch;
      setListingSearch("");
      setTimeout(() => setListingSearch(search), 0);
    }
  };

  const navItems = [
    { key: "overview", label: "Översikt" },
    { key: "users", label: "Användare" },
    { key: "listings", label: "Annonser" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">Offmarket.nu Admin</h1>
          <Link href="/dashboard" className="text-sm text-white/70 hover:text-white">Tillbaka</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(`/admin?tab=${item.key}`)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === item.key ? "bg-navy text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl p-6"><div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" /></div>)}</div>
        ) : tab === "overview" && stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Användare totalt" value={stats.users.total} />
              <StatCard label="Nya denna vecka" value={stats.users.newThisWeek} />
              <StatCard label="Verifierade (BankID)" value={stats.users.verified} />
              <StatCard label="Premium" value={stats.users.premium} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Annonser totalt" value={stats.listings.total} />
              <StatCard label="Aktiva" value={stats.listings.active} />
              <StatCard label="Sålda" value={stats.listings.sold} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Konversationer" value={stats.engagement.conversations} />
              <StatCard label="Meddelanden" value={stats.engagement.messages} />
              <StatCard label="Matchningar" value={stats.engagement.matches} />
              <StatCard label="Aktiva sökprofiler" value={stats.engagement.activeBuyerProfiles} />
            </div>
            <div className="bg-white rounded-xl p-6">
              <h2 className="font-semibold text-navy mb-3">Roller</h2>
              <div className="flex gap-4">
                {Object.entries(stats.users.byRole).map(([role, count]) => (
                  <div key={role} className="text-center">
                    <p className="text-2xl font-bold text-navy">{count}</p>
                    <p className="text-xs text-gray-500 capitalize">{role === "buyer" ? "Köpare" : role === "seller" ? "Säljare" : role === "admin" ? "Admin" : role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : tab === "users" ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Sök användare (namn eller e-post)..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:border-navy outline-none"
            />
            <div className="bg-white rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Användare</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Roll</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Verifierad</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Premium</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-navy">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          {user.role === "buyer" ? "Köpare" : user.role === "seller" ? "Säljare" : user.role === "admin" ? "Admin" : user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${user.bankIdVerified ? "bg-green-500" : "bg-gray-300"}`} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-3 h-3 rounded-full ${user.subscriptionTier === "premium" ? "bg-amber-500" : "bg-gray-300"}`} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleUserAction(user.id, user.bankIdVerified ? "unverify" : "verify")} className="px-2 py-1 text-xs text-gray-500 hover:text-navy">{user.bankIdVerified ? "Avverifiera" : "Verifiera"}</button>
                          <button onClick={() => handleUserAction(user.id, user.subscriptionTier === "premium" ? "removePremium" : "setPremium")} className="px-2 py-1 text-xs text-gray-500 hover:text-navy">{user.subscriptionTier === "premium" ? "Ta bort premium" : "Ge premium"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === "listings" ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Sök annonser (titel, stad, adress)..."
              value={listingSearch}
              onChange={(e) => setListingSearch(e.target.value)}
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:border-navy outline-none"
            />
            <div className="bg-white rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Annons</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Säljare</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Visningar</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/annonser/${listing.id}`} className="text-sm font-medium text-navy hover:underline">{listing.title}</Link>
                        <p className="text-xs text-gray-400">{listing.city} - {listing.propertyType}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{listing.owner?.name ?? "Okänd"}</p>
                        <p className="text-xs text-gray-400">{listing.owner?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${listing.status === "active" ? "bg-green-100 text-green-700" : listing.status === "sold" ? "bg-blue-100 text-blue-700" : listing.status === "paused" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{listing.status}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{listing.viewCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {listing.status !== "removed" && (
                            <button onClick={() => handleListingAction(listing.id, "setStatus", "removed")} className="px-2 py-1 text-xs text-red-500 hover:text-red-700">Ta bort</button>
                          )}
                          {listing.status === "paused" && (
                            <button onClick={() => handleListingAction(listing.id, "setStatus", "active")} className="px-2 py-1 text-xs text-green-500 hover:text-green-700">Aktivera</button>
                          )}
                          <button onClick={() => handleListingAction(listing.id, "toggleFeatured")} className="px-2 py-1 text-xs text-gray-500 hover:text-navy">{listing.featured ? "Avutvald" : "Utvald"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full" /></div>}>
      <AdminContent />
    </Suspense>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-5">
      <p className="text-3xl font-bold text-navy">{value.toLocaleString("sv-SE")}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
