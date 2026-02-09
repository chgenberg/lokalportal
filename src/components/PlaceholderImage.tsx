"use client";

const categoryConfig: Record<string, { label: string; gradient: string }> = {
  butik: { label: "Butik", gradient: "from-navy/[0.06] via-navy/[0.10] to-navy/[0.14]" },
  kontor: { label: "Kontor", gradient: "from-navy/[0.05] via-navy/[0.08] to-navy/[0.12]" },
  lager: { label: "Lager", gradient: "from-navy/[0.07] via-navy/[0.11] to-navy/[0.16]" },
  ovrigt: { label: "Ovrigt", gradient: "from-navy/[0.04] via-navy/[0.07] to-navy/[0.10]" },
};

interface PlaceholderImageProps {
  category: "butik" | "kontor" | "lager" | "ovrigt";
  className?: string;
  showLabel?: boolean;
}

export default function PlaceholderImage({ category, className = "", showLabel = true }: PlaceholderImageProps) {
  const config = categoryConfig[category] ?? categoryConfig.ovrigt;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} ${className}`} aria-hidden>
      {/* Subtle dot grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`dots-${category}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${category})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center shadow-sm backdrop-blur-sm">
            <span className="text-sm font-bold text-navy/60">{config.label.charAt(0)}</span>
          </div>
          {showLabel && <span className="text-[10px] font-semibold text-navy/30 tracking-[0.1em] uppercase">{config.label}</span>}
        </div>
      </div>
    </div>
  );
}
