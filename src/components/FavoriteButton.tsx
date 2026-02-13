"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  listingId: string;
  initialFavorited?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default function FavoriteButton({
  listingId,
  initialFavorited = false,
  className = "",
  size = "md",
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  if (!session) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (favorited) {
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });
        if (res.ok) {
          setFavorited(false);
          toast.success("Borttagen från favoriter");
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });
        if (res.ok) {
          setFavorited(true);
          toast.success("Tillagd i favoriter");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const dim = size === "sm" ? 20 : 24;
  const heart = favorited ? (
    <svg width={dim} height={dim} viewBox="0 0 24 24" fill="currentColor" className="text-red-500" aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-navy/70" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full p-1.5 transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 ${className}`}
      aria-label={favorited ? "Ta bort från favoriter" : "Lägg till i favoriter"}
    >
      {loading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ width: dim, height: dim }} aria-hidden />
      ) : (
        heart
      )}
    </button>
  );
}
