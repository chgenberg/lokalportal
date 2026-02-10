"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { categoryLabels, typeLabels, availableTags } from "@/lib/types";
import CustomSelect from "@/components/CustomSelect";
import ListingCard from "@/components/ListingCard";
import PlaceholderImage from "@/components/PlaceholderImage";

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "overview";
  const isLandlord = session?.user?.role === "landlord";

  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<{ id: string; listingTitle: string; lastMessageAt: string; lastMessage: { createdAt: string } | null }[]>([]);
  const [exploreListings, setExploreListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  type StatsOverview = {
    totalListings: number;
    totalInquiries: number;
    totalFavorites: number;
    responseRate: number;
    topListingId: string | null;
    topListingTitle: string | null;
    recentActivity: { type: "inquiry" | "message" | "favorite"; listingId: string; listingTitle: string; at: string }[];
  };
  type PerListingStats = { listingId: string; inquiryCount: number; favoriteCount: number; lastInquiryAt: string | null; viewCount: number }[];
  const [statsOverview, setStatsOverview] = useState<StatsOverview | null>(null);
  const [perListingStats, setPerListingStats] = useState<PerListingStats>([]);

  const [createForm, setCreateForm] = useState({
    title: "", description: "", city: "", address: "",
    type: "rent" as "sale" | "rent", category: "kontor" as "butik" | "kontor" | "lager" | "ovrigt",
    price: "", size: "", tags: [] as string[], imageUrl: "",
  });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const createImageInputRef = useRef<HTMLInputElement>(null);

  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string; description: string; city: string; address: string;
    type: "sale" | "rent"; category: "butik" | "kontor" | "lager" | "ovrigt";
    price: string; size: string; tags: string[]; imageUrl: string;
  } | null>(null);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [listingsSort, setListingsSort] = useState<"date" | "inquiries" | "views" | "favorites">("date");
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [contactListingId, setContactListingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const unreadPromise = fetch("/api/messages/conversations?unreadOnly=true");
        const listingsPromise = isLandlord ? fetch("/api/listings?mine=true") : null;
        const favPromise = !isLandlord ? fetch("/api/favorites") : null;
        const statsPromise = isLandlord ? fetch("/api/listings/stats") : null;
        const convsPromise = !isLandlord ? fetch("/api/messages/conversations") : null;
        const explorePromise = !isLandlord ? fetch("/api/listings?limit=3") : null;
        const [listingsRes, unreadRes, favRes, statsRes, convsRes, exploreRes] = await Promise.all([
          listingsPromise ?? Promise.resolve(null),
          unreadPromise,
          favPromise ?? Promise.resolve(null),
          statsPromise ?? Promise.resolve(null),
          convsPromise ?? Promise.resolve(null),
          explorePromise ?? Promise.resolve(null),
        ]);
        if (listingsRes?.ok) {
          const data = await listingsRes.json();
          const items = Array.isArray(data) ? data : data.listings || [];
          setListings(items);
        }
        if (favRes?.ok) {
          try { const favData = await favRes.json(); setFavorites(favData.listings || []); } catch { /* */ }
        }
        if (unreadRes.ok) { const unreadData = await unreadRes.json(); setUnreadCount(unreadData.unreadCount ?? 0); }
        if (convsRes?.ok) {
          try {
            const convsData = await convsRes.json();
            setConversations(convsData.conversations ?? []);
          } catch { /* */ }
        }
        if (exploreRes?.ok) {
          try {
            const exploreData = await exploreRes.json();
            setExploreListings(exploreData.listings ?? []);
          } catch { /* */ }
        }
        if (statsRes?.ok) {
          try {
            const statsData = await statsRes.json();
            setStatsOverview(statsData.overview ?? null);
            setPerListingStats(statsData.perListing ?? []);
          } catch { /* */ }
        }
        const profileRes = await fetch("/api/auth/profile");
        if (profileRes.ok) {
          try {
            const profileData = await profileRes.json();
            setProfile({ name: profileData.name ?? "", email: profileData.email ?? "", phone: profileData.phone ?? "" });
          } catch { /* */ }
        }
      } catch { /* */ } finally { setLoading(false); }
    };
    if (session?.user) fetchData();
  }, [session, isLandlord]);

  const handleCreateImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { setCreateError("Endast bilder (JPEG, PNG, GIF, WebP) stöds."); return; }
    if (file.size > 10 * 1024 * 1024) { setCreateError("Bilden får max vara 10 MB."); return; }
    setCreateError(""); setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { const data = await res.json(); setCreateError(data.error || "Kunde inte ladda upp bilden."); return; }
      const data = await res.json();
      setCreateForm((p) => ({ ...p, imageUrl: data.url || "" }));
    } catch { setCreateError("Uppladdning misslyckades."); } finally { setImageUploading(false); }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault(); setCreateError(""); setCreateSuccess(false);
    try {
      const res = await fetch("/api/listings/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...createForm, price: parseInt(createForm.price, 10), size: parseInt(createForm.size, 10) }) });
      if (!res.ok) { const data = await res.json(); setCreateError(data.error || "Kunde inte skapa annons"); return; }
      setCreateSuccess(true);
      setCreateForm({ title: "", description: "", city: "", address: "", type: "rent", category: "kontor", price: "", size: "", tags: [], imageUrl: "" });
    } catch { setCreateError("Något gick fel"); }
  };

  const toggleCreateTag = (tag: string) => { setCreateForm((prev) => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag] })); };

  const removeFavorite = async (listingId: string) => {
    try { await fetch("/api/favorites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId }) }); setFavorites((prev) => prev.filter((l) => l.id !== listingId)); } catch { /* */ }
  };

  const startContactFromFavorite = async (listingId: string) => {
    setContactListingId(listingId);
    try {
      const convRes = await fetch("/api/messages/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId }) });
      if (convRes.ok) {
        const conv = await convRes.json();
        router.push(`/dashboard/meddelanden?conv=${conv.id}`);
        return;
      }
    } catch { /* */ } finally { setContactListingId(null); }
  };

  const startEdit = async (listing: Listing) => {
    setEditError("");
    try {
      const res = await fetch(`/api/listings/${listing.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setEditForm({
        title: data.title ?? "",
        description: data.description ?? "",
        city: data.city ?? "",
        address: data.address ?? "",
        type: data.type ?? "rent",
        category: data.category ?? "kontor",
        price: String(data.price ?? ""),
        size: String(data.size ?? ""),
        tags: Array.isArray(data.tags) ? data.tags : [],
        imageUrl: data.imageUrl ?? "",
      });
      setEditingListingId(listing.id);
    } catch { /* */ }
  };

  const cancelEdit = () => { setEditingListingId(null); setEditForm(null); setEditError(""); };

  const handleEditImageUpload = async (file: File) => {
    if (!editForm) return;
    if (!file.type.startsWith("image/")) { setEditError("Endast bilder stöds."); return; }
    if (file.size > 10 * 1024 * 1024) { setEditError("Bilden får max vara 10 MB."); return; }
    setEditError("");
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { const d = await res.json(); setEditError(d.error || "Kunde inte ladda upp bilden."); return; }
      const d = await res.json();
      setEditForm((p) => (p ? { ...p, imageUrl: d.url || "" } : p));
    } catch { setEditError("Uppladdning misslyckades."); } finally { setImageUploading(false); }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListingId || !editForm) return;
    setEditError("");
    setEditSaving(true);
    try {
      const res = await fetch(`/api/listings/${editingListingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          price: parseInt(editForm.price, 10),
          size: parseInt(editForm.size, 10),
        }),
      });
      if (!res.ok) { const data = await res.json(); setEditError(data.error || "Kunde inte spara"); return; }
      const data = await res.json();
      setListings((prev) => prev.map((l) => (l.id === editingListingId ? { ...l, ...data } : l)));
      cancelEdit();
    } catch { setEditError("Något gick fel"); } finally { setEditSaving(false); }
  };

  const deleteListing = async (listingId: string) => {
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      if (!res.ok) return;
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setDeleteConfirmId(null);
    } catch { /* */ }
  };

  const renewListing = async (listingId: string) => {
    setRenewingId(listingId);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renew: true }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, createdAt: data.createdAt } : l)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch { /* */ } finally { setRenewingId(null); }
  };

  const formatPrice = (price: number, type: string) => type === "sale" ? `${(price / 1000000).toFixed(1)} mkr` : `${price.toLocaleString("sv-SE")} kr/mån`;

  function formatRelativeTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffM < 1) return "nu";
    if (diffM < 60) return `${diffM} min`;
    if (diffH < 24) return `${diffH} h`;
    if (diffD < 7) return `${diffD} d`;
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border p-6 animate-pulse"><div className="h-6 bg-muted rounded w-1/3 mb-4" /><div className="h-4 bg-muted rounded w-2/3" /></div>)}
      </div>
    );
  }

  if (tab === "overview") {
    const ov = statsOverview;
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Välkommen, {session?.user?.name}</h1>
          <p className="text-sm text-gray-500">{isLandlord ? "Hantera dina lokaler och kommunicera med intresserade" : "Utforska lokaler och håll koll på dina favoriter"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLandlord ? (
            <>
              <StatCard label="Aktiva annonser" value={String(listings.length)} />
              <StatCard label="Olästa meddelanden" value={String(unreadCount)} accent={unreadCount > 0} />
              <StatCard label="Förfrågningar" value={ov ? String(ov.totalInquiries) : "–"} />
              <StatCard label="Sparade (favoriter)" value={ov ? String(ov.totalFavorites) : "–"} />
            </>
          ) : (
            <>
              <StatCard label="Sparade favoriter" value={String(favorites.length)} />
              <StatCard label="Olästa meddelanden" value={String(unreadCount)} accent={unreadCount > 0} />
              <StatCard label="Aktiva konversationer" value={String(conversations.length)} />
              <Link href="/annonser" className="block">
                <div className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-md transition-all h-full">
                  <p className="text-2xl font-bold text-navy mb-1">&rarr;</p>
                  <p className="font-semibold text-navy">Utforska lokaler</p>
                  <p className="text-xs text-gray-500 mt-1">Sök bland alla annonser</p>
                </div>
              </Link>
            </>
          )}
        </div>

        {isLandlord && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ov?.responseRate != null && (
              <div className="bg-white rounded-2xl border border-border p-6">
                <h2 className="font-semibold text-navy mb-2">Svarsfrekvens</h2>
                <p className="text-2xl font-bold text-navy">{ov.responseRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Andel förfrågningar där du svarat</p>
              </div>
            )}
            {ov?.topListingId && ov?.topListingTitle && (
              <Link href={`/annonser/${ov.topListingId}`} className="block">
                <div className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-md transition-all">
                  <h2 className="font-semibold text-navy mb-2">Toppresterande annons</h2>
                  <p className="text-navy font-medium truncate">{ov.topListingTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">Flest förfrågningar – öppna annons</p>
                </div>
              </Link>
            )}
          </div>
        )}

        {isLandlord && ov?.recentActivity && ov.recentActivity.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-navy mb-4">Senaste aktivitet</h2>
            <ul className="space-y-3">
              {ov.recentActivity.map((a, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.type === "inquiry" ? "bg-navy" : a.type === "favorite" ? "bg-amber-400" : "bg-gray-300"}`} />
                  <span className="text-gray-500">
                    {a.type === "inquiry" && "Ny förfrågning"}
                    {a.type === "message" && "Nytt meddelande"}
                    {a.type === "favorite" && "Ny favorit"}
                  </span>
                  <span className="text-navy truncate">{a.listingTitle}</span>
                  <span className="text-gray-400 text-xs shrink-0">{formatRelativeTime(a.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isLandlord && (
          <Link href="/dashboard?tab=create" className="block">
            <div className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-md transition-all border-dashed">
              <p className="text-2xl font-bold text-navy mb-1">+</p>
              <p className="font-semibold text-navy">Skapa ny annons</p>
              <p className="text-xs text-gray-500 mt-1">Publicera en lokal</p>
            </div>
          </Link>
        )}

        {!isLandlord && conversations.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-navy mb-4">Senaste aktivitet</h2>
            <ul className="space-y-3">
              {[...conversations]
                .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
                .slice(0, 5)
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-navy" />
                    <span className="text-gray-500">Nytt meddelande i</span>
                    <Link href={`/dashboard/meddelanden?conv=${c.id}`} className="text-navy truncate hover:underline">{c.listingTitle}</Link>
                    <span className="text-gray-400 text-xs shrink-0">{formatRelativeTime(c.lastMessageAt)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {!isLandlord && exploreListings.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-navy mb-4">Utforska</h2>
            <p className="text-sm text-gray-500 mb-4">Senaste annonser – snabblänkar</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exploreListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} favorited={favorites.some((f) => f.id === listing.id)} />
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-navy mb-4">Snabbåtgärder</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/meddelanden" className="px-4 py-2.5 bg-muted text-sm font-medium text-navy rounded-xl hover:bg-muted-dark transition-colors">
              Meddelanden {unreadCount > 0 && <span className="ml-1 inline-flex w-5 h-5 bg-navy text-white text-xs font-bold rounded-full items-center justify-center">{unreadCount}</span>}
            </Link>
            <Link href="/annonser" className="px-4 py-2.5 bg-muted text-sm font-medium text-navy rounded-xl hover:bg-muted-dark transition-colors">Alla annonser</Link>
            <Link href="/karta" className="px-4 py-2.5 bg-muted text-sm font-medium text-navy rounded-xl hover:bg-muted-dark transition-colors">Karta</Link>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "listings" && isLandlord) {
    if (editingListingId && editForm) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-navy">Redigera annons</h1>
            <button type="button" onClick={cancelEdit} className="px-4 py-2.5 text-navy border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Avbryt</button>
          </div>
          <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl border border-border p-6 space-y-5">
            {editError && <div className="p-3 bg-navy/5 border border-navy/10 rounded-xl text-sm text-navy">{editError}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bild (valfritt)</label>
                <input ref={editImageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEditImageUpload(f); e.target.value = ""; }} />
                {editForm.imageUrl ? (
                  <div className="relative inline-block">
                    <img src={editForm.imageUrl} alt="Förhandsgranskning" className="h-40 w-auto rounded-xl border border-border object-cover" />
                    <button type="button" onClick={() => setEditForm((p) => (p ? { ...p, imageUrl: "" } : p))} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm hover:bg-navy-light transition-colors" aria-label="Ta bort bild">×</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => editImageInputRef.current?.click()} disabled={imageUploading} className="w-full py-8 border-2 border-dashed border-border rounded-xl text-sm text-gray-500 hover:border-navy transition-colors disabled:opacity-50">Lägg till bild</button>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rubrik</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm((p) => (p ? { ...p, title: e.target.value } : p))} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stad</label>
                <input type="text" value={editForm.city} onChange={(e) => setEditForm((p) => (p ? { ...p, city: e.target.value } : p))} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adress</label>
                <input type="text" value={editForm.address} onChange={(e) => setEditForm((p) => (p ? { ...p, address: e.target.value } : p))} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
              </div>
              <CustomSelect label="Typ" value={editForm.type} onChange={(v) => setEditForm((p) => (p ? { ...p, type: v as "sale" | "rent" } : p))} options={[{ value: "rent", label: "Uthyres" }, { value: "sale", label: "Till salu" }]} />
              <CustomSelect label="Kategori" value={editForm.category} onChange={(v) => setEditForm((p) => (p ? { ...p, category: v as "butik" | "kontor" | "lager" | "ovrigt" } : p))} options={Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pris (kr)</label>
                <input type="number" value={editForm.price} onChange={(e) => setEditForm((p) => (p ? { ...p, price: e.target.value } : p))} required min="0" className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Storlek (m²)</label>
                <input type="number" value={editForm.size} onChange={(e) => setEditForm((p) => (p ? { ...p, size: e.target.value } : p))} required min="1" className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivning</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm((p) => (p ? { ...p, description: e.target.value } : p))} required rows={4} className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Egenskaper</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const active = editForm.tags.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => setEditForm((p) => (p ? { ...p, tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag] } : p))} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? "bg-navy text-white" : "bg-muted border border-border text-gray-600 hover:border-navy"}`}>{tag}</button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={cancelEdit} className="px-6 py-3 border border-border rounded-xl text-sm font-medium text-gray-600 hover:bg-muted">Avbryt</button>
              <button type="submit" disabled={editSaving} className="px-6 py-3 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50">{editSaving ? "Sparar..." : "Spara ändringar"}</button>
            </div>
          </form>
        </div>
      );
    }
    const sortedListings =
      listingsSort === "date"
        ? [...listings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [...listings].sort((a, b) => {
            const sa = perListingStats.find((s) => s.listingId === a.id);
            const sb = perListingStats.find((s) => s.listingId === b.id);
            const va = listingsSort === "inquiries" ? (sa?.inquiryCount ?? 0) : listingsSort === "views" ? (sa?.viewCount ?? 0) : (sa?.favoriteCount ?? 0);
            const vb = listingsSort === "inquiries" ? (sb?.inquiryCount ?? 0) : listingsSort === "views" ? (sb?.viewCount ?? 0) : (sb?.favoriteCount ?? 0);
            return vb - va;
          });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-navy">Mina annonser</h1>
          <div className="flex items-center gap-3">
            <select
              value={listingsSort}
              onChange={(e) => setListingsSort(e.target.value as "date" | "inquiries" | "views" | "favorites")}
              className="px-3 py-2 rounded-xl border border-border text-sm text-navy bg-white focus:border-navy outline-none"
            >
              <option value="date">Senast skapade</option>
              <option value="inquiries">Flest förfrågningar</option>
              <option value="views">Flest visningar</option>
              <option value="favorites">Flest sparade</option>
            </select>
            <Link href="/dashboard?tab=create" className="px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors whitespace-nowrap">Ny annons</Link>
          </div>
        </div>
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <p className="text-2xl text-gray-200 mb-4">0</p>
            <h3 className="font-semibold text-navy mb-2">Inga annonser ännu</h3>
            <p className="text-sm text-gray-500 mb-6">Skapa din första annons för att nå potentiella hyresgäster</p>
            <Link href="/dashboard?tab=create" className="px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors">Skapa annons</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedListings.map((listing) => {
              const stats = perListingStats.find((s) => s.listingId === listing.id);
              const inquiryCount = stats?.inquiryCount ?? 0;
              const favoriteCount = stats?.favoriteCount ?? 0;
              const lastInquiryAt = stats?.lastInquiryAt ?? null;
              const viewCount = stats?.viewCount ?? 0;
              const lastInquiryMs = lastInquiryAt ? new Date(lastInquiryAt).getTime() : 0;
              const now = Date.now();
              const daysSinceInquiry = lastInquiryMs ? (now - lastInquiryMs) / 86400000 : Infinity;
              const statusColor = inquiryCount === 0 ? "bg-gray-300" : daysSinceInquiry <= 7 ? "bg-green-500" : daysSinceInquiry <= 30 ? "bg-amber-400" : "bg-gray-300";
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} title={inquiryCount === 0 ? "Inga förfrågningar" : daysSinceInquiry <= 7 ? "Aktivitet senaste 7 dagarna" : daysSinceInquiry <= 30 ? "Aktivitet senaste 30 dagarna" : "Ingen nyligen aktivitet"} />
                        <Link href={`/annonser/${listing.id}`} className="font-semibold text-navy hover:text-navy-light transition-colors">{listing.title}</Link>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{listing.address}, {listing.city}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{listing.size} m²</span>
                        <span className="font-semibold text-navy">{formatPrice(listing.price, listing.type)}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span>{inquiryCount} förfrågningar</span>
                        <span>{favoriteCount} sparade</span>
                        {viewCount > 0 && <span>{viewCount} visningar</span>}
                        {lastInquiryAt && <span>Senaste {formatRelativeTime(lastInquiryAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-navy/10 text-navy">{typeLabels[listing.type]}</span>
                      <button type="button" onClick={() => renewListing(listing.id)} disabled={renewingId === listing.id} className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50" title="Förnya annons (visas längst upp)">{renewingId === listing.id ? "..." : "Förnya"}</button>
                      <button type="button" onClick={() => startEdit(listing)} className="px-3 py-1.5 text-xs font-medium text-navy border border-border rounded-lg hover:bg-muted transition-colors">Redigera</button>
                      {deleteConfirmId === listing.id ? (
                        <span className="flex items-center gap-1">
                          <button type="button" onClick={() => deleteListing(listing.id)} className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Ta bort</button>
                          <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 text-xs text-gray-500">Avbryt</button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => setDeleteConfirmId(listing.id)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 border border-border rounded-lg hover:border-red-200 transition-colors">Ta bort</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (tab === "favorites" && !isLandlord) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Sparade favoriter</h1>
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <p className="text-2xl text-gray-200 mb-4">0</p>
            <h3 className="font-semibold text-navy mb-2">Inga favoriter</h3>
            <p className="text-sm text-gray-500 mb-6">Spara lokaler du är intresserad av</p>
            <Link href="/annonser" className="px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors">Utforska lokaler</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((listing) => {
              const favListing = listing as Listing & { savedAt?: string };
              const hasImage = listing.imageUrl && listing.imageUrl.trim() !== "";
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-border p-0 overflow-hidden hover:border-navy/20 hover:shadow-sm transition-all">
                  <div className="flex flex-col sm:flex-row">
                    <Link href={`/annonser/${listing.id}`} className="sm:w-40 shrink-0 relative h-32 sm:h-auto sm:min-h-[120px] block">
                      {hasImage ? (
                        <Image src={listing.imageUrl} alt={listing.title} fill className="object-cover" sizes="160px" />
                      ) : (
                        <PlaceholderImage category={listing.category} className="h-full w-full object-cover" />
                      )}
                    </Link>
                    <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-navy/10 text-navy tracking-wide">{typeLabels[listing.type]}</span>
                          {favListing.savedAt && (
                            <span className="text-[11px] text-gray-400">Sparad {new Date(favListing.savedAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</span>
                          )}
                        </div>
                        <Link href={`/annonser/${listing.id}`} className="font-semibold text-navy hover:text-navy-light transition-colors block mt-1">{listing.title}</Link>
                        <p className="text-sm text-gray-500 mt-0.5">{listing.address}, {listing.city}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{listing.size} m²</span>
                          <span className="font-semibold text-navy">{formatPrice(listing.price, listing.type)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startContactFromFavorite(listing.id)}
                          disabled={contactListingId === listing.id}
                          className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50"
                        >
                          {contactListingId === listing.id ? "Vänta..." : "Kontakta hyresvärd"}
                        </button>
                        <button onClick={() => removeFavorite(listing.id)} className="px-3 py-2 text-xs text-gray-500 hover:text-navy border border-border rounded-xl hover:border-navy/20 transition-colors" aria-label="Ta bort favorit">Ta bort</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (tab === "create" && isLandlord) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Skapa ny annons</h1>
        <form onSubmit={handleCreateListing} className="bg-white rounded-2xl border border-border p-6 space-y-5">
          {createError && <div className="p-3 bg-navy/5 border border-navy/10 rounded-xl text-sm text-navy">{createError}</div>}
          {createSuccess && <div className="p-3 bg-navy/5 border border-navy/10 rounded-xl text-sm text-navy">Annons skapad! Du kan se den under &quot;Mina annonser&quot;.</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bild (valfritt)</label>
              <input ref={createImageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCreateImageUpload(f); e.target.value = ""; }} />
              {createForm.imageUrl ? (
                <div className="relative inline-block">
                  <img src={createForm.imageUrl} alt="Förhandsgranskning" className="h-40 w-auto rounded-xl border border-border object-cover" />
                  <button type="button" onClick={() => setCreateForm((p) => ({ ...p, imageUrl: "" }))} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-sm hover:bg-navy-light transition-colors" aria-label="Ta bort bild">×</button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => createImageInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); createImageInputRef.current?.click(); } }}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-navy", "bg-navy/5"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("border-navy", "bg-navy/5"); }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("border-navy", "bg-navy/5"); const f = e.dataTransfer.files[0]; if (f) handleCreateImageUpload(f); }}
                  className="w-full py-8 border-2 border-dashed border-border rounded-xl text-sm text-gray-500 hover:border-navy hover:text-navy transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  {imageUploading ? "Laddar upp..." : "Klicka eller släpp en bild här (max 10 MB)"}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF eller WebP. Max 10 MB.</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rubrik</label>
              <input type="text" value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" placeholder="T.ex. Modern kontorslokal i centrala Stockholm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stad</label>
              <input type="text" value={createForm.city} onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adress</label>
              <input type="text" value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} required className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
            </div>
            <CustomSelect
              label="Typ"
              value={createForm.type}
              onChange={(v) => setCreateForm((p) => ({ ...p, type: v as "sale" | "rent" }))}
              options={[
                { value: "rent", label: "Uthyres" },
                { value: "sale", label: "Till salu" },
              ]}
            />
            <CustomSelect
              label="Kategori"
              value={createForm.category}
              onChange={(v) => setCreateForm((p) => ({ ...p, category: v as "butik" | "kontor" | "lager" | "ovrigt" }))}
              options={Object.entries(categoryLabels).map(([k, v]) => ({ value: k, label: v }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pris (kr)</label>
              <input type="number" value={createForm.price} onChange={(e) => setCreateForm((p) => ({ ...p, price: e.target.value }))} required min="0" className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" placeholder={createForm.type === "rent" ? "kr/månad" : "Totalpris"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Storlek (m²)</label>
              <input type="number" value={createForm.size} onChange={(e) => setCreateForm((p) => ({ ...p, size: e.target.value }))} required min="1" className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Beskrivning</label>
              <textarea value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} required rows={4} className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-navy outline-none resize-none" placeholder="Beskriv lokalen..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Egenskaper</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const active = createForm.tags.includes(tag);
                  return <button key={tag} type="button" onClick={() => toggleCreateTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active ? "bg-navy text-white" : "bg-muted border border-border text-gray-600 hover:border-navy"}`}>{tag}</button>;
                })}
              </div>
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors">Publicera annons</button>
        </form>
      </div>
    );
  }

  if (tab === "settings") {
    const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!profile) return;
      setProfileSaving(true);
      setProfileSuccess(false);
      try {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: profile.name, phone: profile.phone }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setProfile({ name: data.name, email: data.email, phone: data.phone ?? "" });
        setProfileSuccess(true);
      } catch { /* */ } finally { setProfileSaving(false); }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Inställningar</h1>
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-navy mb-4">Kontoinformation</h2>
          <p className="text-xs text-gray-500 mb-4">Namn och telefon används som standardkontakt när du skapar nya annonser.</p>
          {profile && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Namn / företag</label>
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
              <div className="flex items-center gap-3">
                <button type="submit" disabled={profileSaving} className="px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors disabled:opacity-50">{profileSaving ? "Sparar..." : "Spara ändringar"}</button>
                {profileSuccess && <span className="text-sm text-green-600">Sparat!</span>}
              </div>
            </form>
          )}
          {!profile && <p className="text-sm text-gray-500">Laddar...</p>}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-gray-500">Roll</p>
            <p className="text-sm font-medium text-navy mt-0.5">{isLandlord ? "Hyresvärd" : "Hyresgäst"}</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="px-6 py-3 bg-navy/5 text-navy text-sm font-medium rounded-xl hover:bg-navy/10 transition-colors">Logga ut</button>
      </div>
    );
  }

  return null;
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-sm transition-shadow">
      <p className={`text-2xl font-bold ${accent ? "text-navy" : "text-navy"}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="space-y-6">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border p-6 animate-pulse"><div className="h-6 bg-muted rounded w-1/3 mb-4" /><div className="h-4 bg-muted rounded w-2/3" /></div>)}</div>}>
      <DashboardContent />
    </Suspense>
  );
}
