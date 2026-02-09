"use client";

import { Store, Briefcase, Warehouse, LayoutGrid } from "lucide-react";

const categoryConfig: Record<
  string,
  { Icon: typeof Store; gradient: string; label: string }
> = {
  butik: {
    Icon: Store,
    gradient: "from-blue-100 to-blue-200",
    label: "Butik",
  },
  kontor: {
    Icon: Briefcase,
    gradient: "from-indigo-100 to-indigo-200",
    label: "Kontor",
  },
  lager: {
    Icon: Warehouse,
    gradient: "from-slate-100 to-slate-200",
    label: "Lager",
  },
  ovrigt: {
    Icon: LayoutGrid,
    gradient: "from-violet-100 to-violet-200",
    label: "Övrigt",
  },
};

interface PlaceholderImageProps {
  category: "butik" | "kontor" | "lager" | "ovrigt";
  className?: string;
  showLabel?: boolean;
}

export default function PlaceholderImage({
  category,
  className = "",
  showLabel = true,
}: PlaceholderImageProps) {
  const config = categoryConfig[category] ?? categoryConfig.ovrigt;
  const { Icon, gradient, label } = config;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
      aria-hidden
    >
      {/* Decorative SVG pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`grid-${category}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${category})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 w-14 h-14 rounded-xl bg-white/90 flex items-center justify-center shadow-sm">
            <Icon className="w-7 h-7 text-navy/60" />
          </div>
          {showLabel && (
            <span className="text-xs font-medium text-gray-500">{label}</span>
          )}
        </div>
      </div>
    </div>
  );
}
