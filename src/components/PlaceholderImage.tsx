"use client";

import Image from "next/image";

/** Unsplash-bilder per kategori (gratis, lokal-tema). */
const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  butik: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  kontor: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  lager: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
  ovrigt: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
};

const categoryLabels: Record<string, string> = {
  butik: "Butik",
  kontor: "Kontor",
  lager: "Lager",
  ovrigt: "Övrigt",
};

interface PlaceholderImageProps {
  category: "butik" | "kontor" | "lager" | "ovrigt";
  className?: string;
}

export default function PlaceholderImage({ category, className = "" }: PlaceholderImageProps) {
  const src = UNSPLASH_BY_CATEGORY[category] ?? UNSPLASH_BY_CATEGORY.ovrigt;
  const label = categoryLabels[category] ?? "Lokal";

  return (
    <div className={`relative overflow-hidden bg-navy/[0.06] ${className}`} aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-navy/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold text-white/90 tracking-[0.2em] uppercase select-none drop-shadow-sm">
          {label}
        </span>
      </div>
    </div>
  );
}
