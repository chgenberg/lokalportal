"use client";

import Image from "next/image";
import { categoryLabels as labels, parseCategories } from "@/lib/types";

/** Unsplash-bilder per kategori (gratis, lokal-tema). */
const UNSPLASH_BY_CATEGORY: Record<string, string> = {
  butik: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  kontor: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  lager: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
  restaurang: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
  verkstad: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
  showroom: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
  popup: "https://images.unsplash.com/photo-1528698827591-e19cef791f48?w=800&q=80",
  atelje: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  ovrigt: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
};

interface PlaceholderImageProps {
  category: string;
  className?: string;
}

export default function PlaceholderImage({ category, className = "" }: PlaceholderImageProps) {
  const primary = parseCategories(category)[0] ?? "ovrigt";
  const src = UNSPLASH_BY_CATEGORY[primary] ?? UNSPLASH_BY_CATEGORY.ovrigt;
  const label = labels[primary] ?? "Lokal";

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
