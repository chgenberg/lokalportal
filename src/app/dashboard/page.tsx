"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  MessageCircle,
  Heart,
  PlusCircle,
  Trash2,
  LogOut,
  MapPin,
  Maximize2,
  Tag,
  ChevronDown,
} from "lucide-react";
import type { Listing } from "@/lib/types";
import { categoryLabels, typeLabels, availableTags } from "@/lib/types";

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

  // Create listing state
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    city: "",
    address: "",
    type: "rent" as "sale" | "rent",
    category: "kontor" as "butik" | "kontor" | "lager" | "ovrigt",
    price: "",
    size: "",
    tags: [] as string[],
  });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, unreadRes] = await Promise.all([
          fetch("/api/listings"),
          fetch("/api/messages/conversations?unreadOnly=true"),
        ]);

        if (listingsRes.ok) {
          const data = await listingsRes.json();
          const all = Array.isArray(data) ? data : data.listings || [];
          if (isLandlord) {
            setListings(all.filter((l: Listing) => l.ownerId === session?.user?.id));
          }
          // For favorites, fetch from API
          if (!isLandlord) {
            try {
              const favRes = await fetch("/api/favorites");
              if (favRes.ok) {
                const favData = await favRes.json();
                setFavorites(favData.listings || []);
              }
            } catch {
              // fallback
            }
          }
        }

        if (unreadRes.ok) {
          const unreadData = await unreadRes.json();
          setUnreadCount(unreadData.unreadCount || 0);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (session?.user) fetchData();
  }, [session, isLandlord]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess(false);

    try {
      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          price: parseInt(createForm.price, 10),
          size: parseInt(createForm.size, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Kunde inte skapa annons");
        return;
      }

      setCreateSuccess(true);
      setCreateForm({
        title: "",
        description: "",
        city: "",
        address: "",
        type: "rent",
        category: "kontor",
        price: "",
        size: "",
        tags: [],
      });
    } catch {
      setCreateError("Något gick fel");
    }
  };

  const toggleCreateTag = (tag: string) => {
    setCreateForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const removeFavorite = async (listingId: string) => {
    try {
      await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      setFavorites((prev) => prev.filter((l) => l.id !== listingId));
    } catch {
      // silent
    }
  };

  const formatPrice = (price: number, type: string) => {
    if (type === "sale") return `${(price / 1000000).toFixed(1)} mkr`;
    return `${price.toLocaleString("sv-SE")} kr/mån`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // Overview tab
  if (tab === "overview") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy mb-1">
            Välkommen, {session?.user?.name}
          </h1>
          <p className="text-sm text-gray-500">
            {isLandlord
              ? "Hantera dina lokaler och kommunicera med intresserade"
              : "Utforska lokaler och håll koll på dina favoriter"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLandlord ? (
            <>
              <StatCard
                icon={Building2}
                label="Aktiva annonser"
                value={String(listings.length)}
              />
              <StatCard
                icon={MessageCircle}
                label="Olästa meddelanden"
                value={String(unreadCount)}
                accent={unreadCount > 0}
              />
              <Link href="/dashboard?tab=create" className="block">
                <div className="bg-white rounded-2xl border border-border p-6 hover:border-accent transition-colors">
                  <PlusCircle className="w-8 h-8 text-accent mb-2" />
                  <p className="font-semibold text-navy">Skapa ny annons</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Publicera en lokal
                  </p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <StatCard
                icon={Heart}
                label="Sparade favoriter"
                value={String(favorites.length)}
              />
              <StatCard
                icon={MessageCircle}
                label="Olästa meddelanden"
                value={String(unreadCount)}
                accent={unreadCount > 0}
              />
              <Link href="/annonser" className="block">
                <div className="bg-white rounded-2xl border border-border p-6 hover:border-accent transition-colors">
                  <Building2 className="w-8 h-8 text-accent mb-2" />
                  <p className="font-semibold text-navy">Utforska lokaler</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sök bland alla annonser
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-navy mb-4">Snabbåtgärder</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/meddelanden"
              className="flex items-center gap-2 px-4 py-2.5 bg-muted text-sm font-medium text-navy rounded-xl hover:bg-muted-dark transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Meddelanden
              {unreadCount > 0 && (
                <span className="ml-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/annonser"
              className="flex items-center gap-2 px-4 py-2.5 bg-muted text-sm font-medium text-navy rounded-xl hover:bg-muted-dark transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Alla annonser
            </Link>
            <Link
              href="/karta"
              className="flex items-center gap-2 px-4 py-2.5 bg-muted text-sm font-medium text-navy rounded-xl hover:bg-muted-dark transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Karta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Landlord: My listings
  if (tab === "listings" && isLandlord) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">Mina annonser</h1>
          <Link
            href="/dashboard?tab=create"
            className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Ny annons
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-navy mb-2">Inga annonser ännu</h3>
            <p className="text-sm text-gray-500 mb-6">
              Skapa din första annons för att nå potentiella hyresgäster
            </p>
            <Link
              href="/dashboard?tab=create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Skapa annons
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-border p-6 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/annonser/${listing.id}`}
                      className="font-semibold text-navy hover:text-accent transition-colors"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {listing.address}, {listing.city}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        {listing.size} m²
                      </span>
                      <span className="font-semibold text-navy">
                        {formatPrice(listing.price, listing.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        listing.type === "rent"
                          ? "bg-accent/10 text-accent"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {typeLabels[listing.type]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Tenant: Favorites
  if (tab === "favorites" && !isLandlord) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Sparade favoriter</h1>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-navy mb-2">Inga favoriter</h3>
            <p className="text-sm text-gray-500 mb-6">
              Spara lokaler du är intresserad av för att hitta dem snabbt
            </p>
            <Link
              href="/annonser"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-sm font-medium rounded-xl hover:bg-navy-light transition-colors"
            >
              Utforska lokaler
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-border p-6 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/annonser/${listing.id}`}
                      className="font-semibold text-navy hover:text-accent transition-colors"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {listing.address}, {listing.city}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{listing.size} m²</span>
                      <span className="font-semibold text-navy">
                        {formatPrice(listing.price, listing.type)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFavorite(listing.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Ta bort favorit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Create listing
  if (tab === "create" && isLandlord) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Skapa ny annons</h1>

        <form
          onSubmit={handleCreateListing}
          className="bg-white rounded-2xl border border-border p-6 space-y-5"
        >
          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {createError}
            </div>
          )}
          {createSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
              Annons skapad! Du kan se den under &quot;Mina annonser&quot;.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rubrik
              </label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, title: e.target.value }))
                }
                required
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none"
                placeholder="T.ex. Modern kontorslokal i centrala Stockholm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stad
              </label>
              <input
                type="text"
                value={createForm.city}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, city: e.target.value }))
                }
                required
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adress
              </label>
              <input
                type="text"
                value={createForm.address}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, address: e.target.value }))
                }
                required
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Typ
              </label>
              <div className="relative">
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      type: e.target.value as "sale" | "rent",
                    }))
                  }
                  className="w-full appearance-none px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none pr-10"
                >
                  <option value="rent">Uthyres</option>
                  <option value="sale">Till salu</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kategori
              </label>
              <div className="relative">
                <select
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      category: e.target.value as
                        | "butik"
                        | "kontor"
                        | "lager"
                        | "ovrigt",
                    }))
                  }
                  className="w-full appearance-none px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none pr-10"
                >
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Pris (kr)
              </label>
              <input
                type="number"
                value={createForm.price}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, price: e.target.value }))
                }
                required
                min="0"
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none"
                placeholder={
                  createForm.type === "rent" ? "kr/månad" : "Totalpris"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Storlek (m²)
              </label>
              <input
                type="number"
                value={createForm.size}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, size: e.target.value }))
                }
                required
                min="1"
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Beskrivning
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, description: e.target.value }))
                }
                required
                rows={4}
                className="w-full px-4 py-3 bg-muted rounded-xl text-sm border border-border focus:border-accent outline-none resize-none"
                placeholder="Beskriv lokalen..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Egenskaper
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const active = createForm.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleCreateTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? "bg-navy text-white"
                          : "bg-muted border border-border text-gray-600 hover:border-navy"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-navy text-white text-sm font-semibold rounded-xl hover:bg-navy-light transition-colors flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Publicera annons
          </button>
        </form>
      </div>
    );
  }

  // Settings
  if (tab === "settings") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-navy">Inställningar</h1>

        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-navy mb-4">Kontoinformation</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-gray-500">Namn</span>
              <span className="text-navy font-medium">
                {session?.user?.name}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-gray-500">E-post</span>
              <span className="text-navy font-medium">
                {session?.user?.email}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-gray-500">Roll</span>
              <span className="text-navy font-medium">
                {isLandlord ? "Hyresvärd" : "Hyresgäst"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logga ut
        </button>
      </div>
    );
  }

  // Default fallback
  return null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <Icon
        className={`w-8 h-8 mb-2 ${accent ? "text-accent" : "text-navy/40"}`}
      />
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-6 animate-pulse"
            >
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
