"use client";

import Image from "next/image";
import { categoryLabels as labels, parseCategories } from "@/lib/types";

/** Unsplash-bilder per kategori (gratis, lokal-tema). */
const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  villa: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  lagenhet: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  radhus: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80",
  fritidshus: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
  tomt: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  gard: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&q=80",
  ovrigt: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
};

interface PlaceholderImageProps {
  category: string;
  className?: string;
}

export default function PlaceholderImage({ category, className = "" }: PlaceholderImageProps) {
  const primary = parseCategories(category)[0] ?? "ovrigt";
  const src = UNSPLASH_BY_CATEGORY[primary] ?? UNSPLASH_BY_CATEGORY.ovrigt;
  const label = labels[primary] ?? "Bostad";

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
