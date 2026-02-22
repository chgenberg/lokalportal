"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/formatPrice";

/* ── Types ──────────────────────────────────────────── */

interface AgentClient {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  listingCount: number;
  createdAt: string;
  clientSince: string;
}

interface PortfolioListing {
  id: string;
  title: string;
  city: string;
  address: string;
  type: string;
  category: string;
  price: number;
  size: number;
  imageUrl: string;
  imageUrls: string[];
  viewCount: number;
  createdAt: string;
  ownerId: string | null;
  agentId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  stripeStatus: string;
  tags: string[];
}

interface AgentStats {
  totalClients: number;
  totalListings: number;
  totalViews: number;
  totalInquiries: number;
  totalFavorites: number;
  portfolioValue: number;
  responseRate: number;
  unreadMessages?: number;
  recentActivity: { type: string; listingId: string; listingTitle: string; at: string }[];
  perClient: { clientId: string; clientName: string; listingCount: number; totalViews: number; totalInquiries: number }[];
  categoryDistribution: Record<string, number>;
}

/* ── Stat Card ──────────────────────────────────────── */

function StatCard({ label, value, accent, sub }: { label: string; value: string; accent?: boolean; sub?: string }) {
  return (
    <div className="dashboard-card p-5">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-orange-500" : "text-navy"}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */

export default function MaklareDashboardClient() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "overview";

  const [stats, setStats] = useState<AgentStats | null>(null);
  const [clients, setClients] = useState<AgentClient[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Client add form
  const [addClientEmail, setAddClientEmail] = useState("");
  const [addClientNote, setAddClientNote] = useState("");
  const [addClientLoading, setAddClientLoading] = useState(false);

  // Portfolio filter
  const [portfolioClientFilter, setPortfolioClientFilter] = useState<string>("all");

  // Settings
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string; logoUrl?: string; companyName?: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Selected client detail
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, clientsRes, portfolioRes, profileRes] = await Promise.all([
        fetch("/api/agent/stats"),
        fetch("/api/agent/clients"),
        fetch("/api/agent/portfolio"),
        fetch("/api/auth/profile"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }
      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        setPortfolio(data.listings || []);
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile({ name: data.name, email: data.email, phone: data.phone ?? "", logoUrl: data.logoUrl ?? "", companyName: data.companyName ?? "" });
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addClientEmail.trim()) return;
    setAddClientLoading(true);
    try {
      const res = await fetch("/api/agent/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addClientEmail.trim(), note: addClientNote.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Kunde inte lägga till klient");
        return;
      }
      setClients((prev) => [data, ...prev]);
      setAddClientEmail("");
      setAddClientNote("");
      toast.success(`${data.name} har lagts till som klient`);
    } catch {
      toast.error("Något gick fel");
    } finally {
      setAddClientLoading(false);
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    try {
      const res = await fetch(`/api/agent/clients/${clientId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Kunde inte ta bort klient");
        return;
      }
      setClients((prev) => prev.filter((c) => c.clientId !== clientId));
      toast.success("Klient borttagen");
    } catch {
      toast.error("Något gick fel");
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) return;
      const data = await res.json();
      setProfile((p) => (p ? { ...p, logoUrl: data.url || "" } : p));
    } catch { /* */ } finally { setLogoUploading(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          companyName: profile.companyName ?? "",
          logoUrl: profile.logoUrl ?? "",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setProfile({ name: data.name, email: data.email, phone: data.phone ?? "", logoUrl: data.logoUrl ?? "", companyName: data.companyName ?? "" });
      setProfileSuccess(true);
    } catch { /* */ } finally { setProfileSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="dashboard-card p-6 space-y-3">
              <div className="h-4 w-20 bg-muted rounded-xl" />
              <div className="h-8 w-16 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── OVERVIEW TAB ─────────────────────────────────── */
  if (tab === "overview") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Översikt</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Klienter" value={String(stats?.totalClients ?? 0)} />
          <StatCard label="Aktiva annonser" value={String(stats?.totalListings ?? 0)} />
          <StatCard label="Olästa meddelanden" value={String(stats?.unreadMessages ?? 0)} accent={(stats?.unreadMessages ?? 0) > 0} />
          <StatCard label="Totala visningar" value={String(stats?.totalViews ?? 0)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard label="Förfrågningar" value={String(stats?.totalInquiries ?? 0)} />
          <StatCard label="Sparade (favoriter)" value={String(stats?.totalFavorites ?? 0)} />
          <StatCard label="Portföljvärde" value={formatPrice(stats?.portfolioValue ?? 0, "sale")} sub="Totalt pris alla annonser" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/maklare?tab=clients" className="dashboard-card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-colors">
                <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Hantera klienter</p>
                <p className="text-xs text-gray-400">Lägg till och hantera</p>
              </div>
            </div>
          </Link>
          <Link href="/skapa-annons" className="dashboard-card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-colors">
                <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Skapa annons</p>
                <p className="text-xs text-gray-400">Ny annons åt klient</p>
              </div>
            </div>
          </Link>
          <Link href="/maklare/meddelanden" className="dashboard-card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center group-hover:bg-navy/10 transition-colors">
                <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Meddelanden</p>
                <p className="text-xs text-gray-400">Se konversationer</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div className="dashboard-card p-6">
            <h2 className="font-semibold text-navy mb-4">Senaste aktivitet</h2>
            <div className="space-y-3">
              {stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${a.type === "inquiry" ? "bg-blue-50 text-blue-500" : "bg-pink-50 text-pink-500"}`}>
                    {a.type === "inquiry" ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-navy font-medium truncate">
                      {a.type === "inquiry" ? "Ny förfrågan" : "Ny favorit"} – {a.listingTitle}
                    </p>
                    <p className="text-[11px] text-gray-400">{new Date(a.at).toLocaleDateString("sv-SE")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-client overview */}
        {stats?.perClient && stats.perClient.length > 0 && (
          <div className="dashboard-card p-6">
            <h2 className="font-semibold text-navy mb-4">Klientöversikt</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Klient</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Annonser</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Visningar</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Förfrågningar</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perClient.map((c) => (
                    <tr key={c.clientId} className="border-b border-border/20 last:border-0">
                      <td className="py-2.5 px-3 font-medium text-navy">{c.clientName}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{c.listingCount}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{c.totalViews}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{c.totalInquiries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── CLIENTS TAB ──────────────────────────────────── */
  if (tab === "clients") {
    const selectedClient = selectedClientId ? clients.find((c) => c.clientId === selectedClientId) : null;
    const clientListings = selectedClientId ? portfolio.filter((l) => l.ownerId === selectedClientId) : [];

    if (selectedClient) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedClientId(null)} className="px-3 py-2 text-navy border border-border/60 rounded-2xl text-sm font-medium hover:bg-muted/60 transition-colors">
              <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Tillbaka
            </button>
            <h1 className="text-2xl font-bold text-navy">{selectedClient.name}</h1>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Annonser" value={String(clientListings.length)} />
            <StatCard label="Totala visningar" value={String(clientListings.reduce((s, l) => s + l.viewCount, 0))} />
            <StatCard label="E-post" value={selectedClient.email} />
            <StatCard label="Klient sedan" value={new Date(selectedClient.clientSince).toLocaleDateString("sv-SE")} />
          </div>

          {selectedClient.note && (
            <div className="dashboard-card p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Anteckning</p>
              <p className="text-sm text-navy">{selectedClient.note}</p>
            </div>
          )}

          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-navy">Annonser</h2>
              <Link href="/skapa-annons" className="px-4 py-2 bg-navy text-white text-xs font-medium rounded-xl hover:bg-navy-light transition-colors">
                Skapa annons åt klient
              </Link>
            </div>
            {clientListings.length === 0 ? (
              <p className="text-sm text-gray-500">Inga annonser ännu</p>
            ) : (
              <div className="space-y-3">
                {clientListings.map((l) => (
                  <ListingRow key={l.id} listing={l} />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Klienter</h1>

        {/* Add client form */}
        <div className="dashboard-card p-6">
          <h2 className="font-semibold text-navy mb-3">Lägg till klient</h2>
          <p className="text-xs text-gray-500 mb-4">Sök efter en befintlig hyresvärd via e-postadress för att koppla dem som din klient.</p>
          <form onSubmit={handleAddClient} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={addClientEmail}
              onChange={(e) => setAddClientEmail(e.target.value)}
              placeholder="Hyresvärdens e-postadress"
              className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none"
              required
            />
            <input
              type="text"
              value={addClientNote}
              onChange={(e) => setAddClientNote(e.target.value)}
              placeholder="Anteckning (valfritt)"
              className="flex-1 px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none"
            />
            <button
              type="submit"
              disabled={addClientLoading}
              className="px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {addClientLoading ? "Söker..." : "Lägg till"}
            </button>
          </form>
        </div>

        {/* Client list */}
        <div className="dashboard-card p-6">
          <h2 className="font-semibold text-navy mb-4">Dina klienter ({clients.length})</h2>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-3xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-navy/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
              </div>
              <p className="text-sm font-semibold text-navy">Inga klienter ännu</p>
              <p className="text-xs text-gray-400 mt-1">Lägg till din första klient ovan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((c) => (
                <div key={c.id} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-navy/8 flex items-center justify-center text-navy text-sm font-bold shrink-0">
                    {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button onClick={() => setSelectedClientId(c.clientId)} className="text-sm font-semibold text-navy hover:underline text-left">
                      {c.name}
                    </button>
                    <p className="text-xs text-gray-400 truncate">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-navy">{c.listingCount} annonser</p>
                    <p className="text-[11px] text-gray-400">Sedan {new Date(c.clientSince).toLocaleDateString("sv-SE")}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Ta bort ${c.name} som klient?`)) handleRemoveClient(c.clientId);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Ta bort klient"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── PORTFOLIO TAB ────────────────────────────────── */
  if (tab === "portfolio") {
    const uniqueOwners = Array.from(new Map(portfolio.filter((l) => l.ownerName).map((l) => [l.ownerId, l.ownerName])).entries());
    const filtered = portfolioClientFilter === "all"
      ? portfolio
      : portfolioClientFilter === "own"
        ? portfolio.filter((l) => l.ownerId === session?.user?.id)
        : portfolio.filter((l) => l.ownerId === portfolioClientFilter);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-navy">Portfölj</h1>
          <div className="flex items-center gap-3">
            <select
              value={portfolioClientFilter}
              onChange={(e) => setPortfolioClientFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-border/60 rounded-xl text-sm text-navy outline-none focus:border-navy"
            >
              <option value="all">Alla annonser</option>
              <option value="own">Mina egna</option>
              {uniqueOwners.map(([id, name]) => (
                id !== session?.user?.id && <option key={id} value={id!}>{name}</option>
              ))}
            </select>
            <Link href="/skapa-annons" className="px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors whitespace-nowrap">
              Ny annons
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Totalt" value={String(filtered.length)} />
          <StatCard label="Aktiva" value={String(filtered.filter((l) => l.stripeStatus === "active" || l.stripeStatus === "free").length)} />
          <StatCard label="Totala visningar" value={String(filtered.reduce((s, l) => s + l.viewCount, 0))} />
          <StatCard label="Portföljvärde" value={formatPrice(filtered.reduce((s, l) => s + l.price, 0), "sale")} />
        </div>

        {filtered.length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <p className="text-sm text-gray-500">Inga annonser att visa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((l) => (
              <ListingRow key={l.id} listing={l} showOwner />
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── STATISTICS TAB ───────────────────────────────── */
  if (tab === "statistics") {
    const categoryLabels: Record<string, string> = {
      butik: "Butik", kontor: "Kontor", lager: "Lager", restaurang: "Restaurang",
      verkstad: "Verkstad", showroom: "Showroom", popup: "Pop-up", atelje: "Ateljé",
      gym: "Gym", ovrigt: "Övrigt",
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Statistik</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Totala visningar" value={String(stats?.totalViews ?? 0)} />
          <StatCard label="Förfrågningar" value={String(stats?.totalInquiries ?? 0)} />
          <StatCard label="Sparade (favoriter)" value={String(stats?.totalFavorites ?? 0)} />
          <StatCard label="Svarsfrekvens" value={`${stats?.responseRate ?? 0}%`} />
        </div>

        {/* Category distribution */}
        {stats?.categoryDistribution && Object.keys(stats.categoryDistribution).length > 0 && (
          <div className="dashboard-card p-6">
            <h2 className="font-semibold text-navy mb-4">Kategorifördelning</h2>
            <div className="space-y-3">
              {Object.entries(stats.categoryDistribution).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                const total = Object.values(stats.categoryDistribution).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm text-navy w-24 shrink-0">{categoryLabels[cat] ?? cat}</span>
                    <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full bg-navy/20 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-client breakdown */}
        {stats?.perClient && stats.perClient.length > 0 && (
          <div className="dashboard-card p-6">
            <h2 className="font-semibold text-navy mb-4">Per klient</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Klient</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Annonser</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Visningar</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Förfrågningar</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perClient.map((c) => (
                    <tr key={c.clientId} className="border-b border-border/20 last:border-0">
                      <td className="py-2.5 px-3 font-medium text-navy">{c.clientName}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{c.listingCount}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{c.totalViews}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">{c.totalInquiries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── SETTINGS TAB ─────────────────────────────────── */
  if (tab === "settings") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Inställningar</h1>

        <div className="dashboard-card p-6">
          <h2 className="font-semibold text-navy mb-4">Mäklarprofil</h2>
          <p className="text-xs text-gray-500 mb-4">Denna information visas i dina annonser och på din profil.</p>
          {profile && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Namn</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile((p) => (p ? { ...p, name: e.target.value } : p))} className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">E-post</label>
                <input type="email" value={profile.email} readOnly className="w-full px-4 py-3 bg-muted/50 rounded-xl text-sm border border-border text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Telefon</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile((p) => (p ? { ...p, phone: e.target.value } : p))} className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" placeholder="T.ex. 070-123 45 67" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Mäklarbyrå / företagsnamn</label>
                <input type="text" value={profile.companyName ?? ""} onChange={(e) => setProfile((p) => (p ? { ...p, companyName: e.target.value } : p))} className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" placeholder="T.ex. ABC Fastigheter" />
                <p className="text-[11px] text-gray-400 mt-1">Visas i dina annonser tillsammans med logotypen</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Logotyp</label>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
                {profile.logoUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      <img src={profile.logoUrl} alt="Logotyp" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="px-3 py-1.5 text-xs font-medium bg-navy/5 text-navy rounded-lg hover:bg-navy/10 disabled:opacity-50">Byt bild</button>
                      <button type="button" onClick={() => setProfile((p) => (p ? { ...p, logoUrl: "" } : p))} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600">Ta bort</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => logoInputRef.current?.click()} disabled={logoUploading} className="w-full py-8 border-2 border-dashed border-border rounded-xl text-sm text-gray-500 hover:border-navy hover:text-navy transition-colors disabled:opacity-50">
                    {logoUploading ? "Laddar upp..." : "Klicka för att ladda upp logotyp (max 2 MB)"}
                  </button>
                )}
                <p className="text-[11px] text-gray-400 mt-1">Visas i dina annonser. Rekommenderad: kvadratisk, minst 200x200 px</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={profileSaving} className="px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50">{profileSaving ? "Sparar..." : "Spara ändringar"}</button>
                {profileSuccess && <span className="text-sm text-green-600">Sparat!</span>}
              </div>
            </form>
          )}
          {!profile && <p className="text-sm text-gray-500">Laddar...</p>}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-gray-500">Roll</p>
            <p className="text-sm font-medium text-navy mt-0.5">Mäklare</p>
          </div>
        </div>

        <button onClick={() => signOut({ callbackUrl: "/" })} className="px-6 py-3 bg-navy/5 text-navy text-sm font-medium rounded-full hover:bg-navy/10 transition-colors">Logga ut</button>
      </div>
    );
  }

  return null;
}

/* ── Listing Row Component ──────────────────────────── */

function ListingRow({ listing, showOwner }: { listing: PortfolioListing; showOwner?: boolean }) {
  const img = listing.imageUrls?.[0] || listing.imageUrl;
  const typeLabel = listing.type === "rent" ? "Uthyrning" : "Försäljning";

  return (
    <Link href={`/annonser/${listing.id}`} className="dashboard-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
        {img ? (
          <Image src={img} alt={listing.title} width={64} height={64} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22V18h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-navy truncate group-hover:underline">{listing.title}</p>
        <p className="text-xs text-gray-400 truncate">{listing.city} · {typeLabel} · {formatPrice(listing.price, listing.type)}</p>
        {showOwner && listing.ownerName && (
          <p className="text-[11px] text-gray-400 mt-0.5">Klient: {listing.ownerName}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-500">{listing.viewCount} visningar</p>
        <p className="text-[11px] text-gray-400">{new Date(listing.createdAt).toLocaleDateString("sv-SE")}</p>
      </div>
    </Link>
  );
}
