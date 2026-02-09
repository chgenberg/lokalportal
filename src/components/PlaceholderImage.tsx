"use client";

const categoryConfig: Record<string, { label: string; bgClass: string }> = {
  butik: { label: "Butik", bgClass: "from-navy/10 to-navy/20" },
  kontor: { label: "Kontor", bgClass: "from-navy/8 to-navy/16" },
  lager: { label: "Lager", bgClass: "from-navy/12 to-navy/22" },
  ovrigt: { label: "Övrigt", bgClass: "from-navy/6 to-navy/14" },
};

interface PlaceholderImageProps {
  category: "butik" | "kontor" | "lager" | "ovrigt";
  className?: string;
  showLabel?: boolean;
}

export default function PlaceholderImage({ category, className = "", showLabel = true }: PlaceholderImageProps) {
  const config = categoryConfig[category] ?? categoryConfig.ovrigt;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${config.bgClass} ${className}`} aria-hidden>
      <svg className="absolute inset-0 h-full w-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${category}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${category})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 w-14 h-14 rounded-xl bg-white/90 flex items-center justify-center shadow-sm">
            <span className="text-lg font-bold text-navy">{config.label.charAt(0)}</span>
          </div>
          {showLabel && <span className="text-xs font-medium text-gray-500">{config.label}</span>}
        </div>
      </div>
    </div>
  );
}
