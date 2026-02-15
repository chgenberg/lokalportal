"use client";

import type { PdfTemplate } from "@/lib/pdf-listing";

const TEMPLATE_LABELS: Record<PdfTemplate, string> = {
  1: "Klassisk",
  2: "Två kolumner",
  3: "Editorial",
  4: "Kompakt",
  5: "Premium",
};

interface PdfTemplateSelectorProps {
  value: PdfTemplate;
  onChange: (t: PdfTemplate) => void;
  className?: string;
}

export default function PdfTemplateSelector({ value, onChange, className = "" }: PdfTemplateSelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">PDF-layout</span>
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            title={TEMPLATE_LABELS[t]}
            className={`w-8 h-8 rounded-lg text-[12px] font-semibold transition-all ${
              value === t
                ? "bg-navy text-white shadow-sm"
                : "bg-muted/80 text-gray-500 hover:bg-muted hover:text-navy"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
