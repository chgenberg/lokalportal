"use client";

const categoryConfig: Record<string, { label: string; gradient: string }> = {
  butik: { label: "Butik", gradient: "from-navy/[0.04] via-navy/[0.08] to-navy/[0.13]" },
  kontor: { label: "Kontor", gradient: "from-navy/[0.03] via-navy/[0.07] to-navy/[0.11]" },
  lager: { label: "Lager", gradient: "from-navy/[0.05] via-navy/[0.09] to-navy/[0.14]" },
  ovrigt: { label: "Övrigt", gradient: "from-navy/[0.03] via-navy/[0.06] to-navy/[0.10]" },
};

interface PlaceholderImageProps {
  category: "butik" | "kontor" | "lager" | "ovrigt";
  className?: string;
}

export default function PlaceholderImage({ category, className = "" }: PlaceholderImageProps) {
  const config = categoryConfig[category] ?? categoryConfig.ovrigt;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient} ${className}`} aria-hidden>
      {/* Subtle dot grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`dots-${category}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.6" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${category})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold text-navy/25 tracking-[0.2em] uppercase select-none">
          {config.label}
        </span>
      </div>
    </div>
  );
}
