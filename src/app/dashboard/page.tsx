"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { categoryLabels, typeLabels, availableTags } from "@/lib/types";
import CustomSelect from "@/components/CustomSelect";

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") || "overview";
  const isLandlord = session?.user?.role === "landlord";

  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
  const editImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, unreadRes] = await Promise.all([fetch("/api/listings"), fetch("/api/messages/conversations?unreadOnly=true")]);
        if (listingsRes.ok) {
          const data = await listingsRes.json();
          const all = Array.isArray(data) ? data : data.listings || [];
          if (isLandlord) setListings(all.filter((l: Listing) => l.ownerId === session?.user?.id));
          if (!isLandlord) {
            try { const favRes = await fetch("/api/favorites"); if (favRes.ok) { const favData = await favRes.json(); setFavorites(favData.listings || []); } } catch { /* */ }
          }
        }
        if (unreadRes.ok) { const unreadData = await unreadRes.json(); setUnreadCount(unreadData.unreadCount || 0); }
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

  const formatPrice = (price: number, type: string) => type === "sale" ? `${(price / 1000000).toFixed(1)} mkr` : `${price.toLocaleString("sv-SE")} kr/mån`;

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-border p-6 animate-pulse"><div className="h-6 bg-muted rounded w-1/3 mb-4" /><div className="h-4 bg-muted rounded w-2/3" /></div>)}
      </div>
    );
  }

  if (tab === "overview") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">Välkommen, {session?.user?.name}</h1>
          <p className="text-sm text-gray-500">{isLandlord ? "Hantera dina lokaler och kommunicera med intresserade" : "Utforska lokaler och håll koll på dina favoriter"}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLandlord ? (
            <>
              <StatCard label="Aktiva annonser" value={String(listings.length)} />
              <StatCard label="Olästa meddelanden" value={String(unreadCount)} accent={unreadCount > 0} />
              <Link href="/dashboard?tab=create" className="block">
                <div className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-md transition-all">
                  <p className="text-2xl font-bold text-navy mb-1">+</p>
                  <p className="font-semibold text-navy">Skapa ny annons</p>
                  <p className="text-xs text-gray-500 mt-1">Publicera en lokal</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <StatCard label="Sparade favoriter" value={String(favorites.length)} />
              <StatCard label="Olästa meddelanden" value={String(unreadCount)} accent={unreadCount > 0} />
              <Link href="/annonser" className="block">
                <div className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-md transition-all">
                  <p className="text-2xl font-bold text-navy mb-1">&rarr;</p>
                  <p className="font-semibold text-navy">Utforska lokaler</p>
                  <p className="text-xs text-gray-500 mt-1">Sök bland alla annonser</p>
                </div>
              </Link>
            </>
          )}
        </div>

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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">Mina annonser</h1>
          <Link href="/dashboard?tab=create" className="px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors">Ny annons</Link>
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
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/annonser/${listing.id}`} className="font-semibold text-navy hover:text-navy-light transition-colors">{listing.title}</Link>
                    <p className="text-sm text-gray-500 mt-1">{listing.address}, {listing.city}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{listing.size} m²</span>
                      <span className="font-semibold text-navy">{formatPrice(listing.price, listing.type)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-navy/10 text-navy">{typeLabels[listing.type]}</span>
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
            ))}
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
            {favorites.map((listing) => (
              <div key={listing.id} className="bg-white rounded-2xl border border-border p-6 hover:border-navy/20 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/annonser/${listing.id}`} className="font-semibold text-navy hover:text-navy-light transition-colors">{listing.title}</Link>
                    <p className="text-sm text-gray-500 mt-1">{listing.address}, {listing.city}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{listing.size} m²</span>
                      <span className="font-semibold text-navy">{formatPrice(listing.price, listing.type)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFavorite(listing.id)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-navy border border-border rounded-lg hover:border-navy/20 transition-colors" aria-label="Ta bort favorit">Ta bort</button>
                </div>
              </div>
            ))}
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
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Inställningar</h1>
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-navy mb-4">Kontoinformation</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border"><span className="text-gray-500">Namn</span><span className="text-navy font-medium">{session?.user?.name}</span></div>
            <div className="flex justify-between py-2 border-b border-border"><span className="text-gray-500">E-post</span><span className="text-navy font-medium">{session?.user?.email}</span></div>
            <div className="flex justify-between py-2 border-b border-border"><span className="text-gray-500">Roll</span><span className="text-navy font-medium">{isLandlord ? "Hyresvärd" : "Hyresgäst"}</span></div>
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
