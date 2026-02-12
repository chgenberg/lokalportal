"use client";

import RangeSlider from "./RangeSlider";
import CustomSelect from "./CustomSelect";
import { availableTags, categoryLabels, allCategories } from "@/lib/types";

export interface FilterState {
  city: string;
  type: string;
  category: string;
  searchInput: string;
  priceRange: [number, number];
  salePriceRange: [number, number];
  sizeRange: [number, number];
  selectedTags: string[];
  nearTo: string[];
}

const NEAR_TO_OPTIONS = [
  "Köpcentrum",
  "Tågstation",
  "Busstation",
  "Stadskärna",
  "Industriområde",
];

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  onClear: () => void;
  onClose?: () => void;
  totalResults: number;
  loading: boolean;
  compact?: boolean;
}

export default function FilterPanel({ filters, onChange, onClear, onClose, totalResults, loading, compact }: FilterPanelProps) {
  const toggleTag = (tag: string) => {
    const selected = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onChange({ selectedTags: selected });
  };

  const toggleNearTo = (option: string) => {
    const selected = filters.nearTo.includes(option)
      ? filters.nearTo.filter((t) => t !== option)
      : [...filters.nearTo, option];
    onChange({ nearTo: selected });
  };

  return (
    <div className={`bg-white rounded-2xl border border-border shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-navy">Filter</h2>
        <div className="flex items-center gap-3">
          {onClose && (
            <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-navy rounded-lg transition-colors" aria-label="Stäng filter">
              <span className="text-xl leading-none">&times;</span>
            </button>
          )}
          <button type="button" onClick={onClear} className="text-sm text-gray-500 hover:text-navy font-medium transition-colors">
            Rensa
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Stad</label>
          <input
            type="text"
            placeholder="Alla städer"
            value={filters.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full px-4 py-2.5 bg-muted/50 rounded-xl text-sm border border-border focus:border-navy outline-none"
            aria-label="Filtrera på stad"
          />
        </div>
        <CustomSelect
          label="Typ"
          value={filters.type}
          onChange={(v) => onChange({ type: v })}
          placeholder="Alla typer"
          options={[
            { value: "", label: "Alla typer" },
            { value: "sale", label: "Till salu" },
            { value: "rent", label: "Uthyres" },
          ]}
        />
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-2 tracking-wide uppercase">Kategori</label>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.map((cat) => {
              const selectedCats = filters.category ? filters.category.split(",") : [];
              const active = selectedCats.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? selectedCats.filter((c) => c !== cat)
                      : [...selectedCats, cat];
                    onChange({ category: next.filter(Boolean).join(",") });
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                    active
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-gray-500 border-border hover:border-navy/20 hover:text-navy"
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <RangeSlider
            min={0}
            max={20}
            step={0.5}
            value={filters.salePriceRange}
            onChange={(v) => onChange({ salePriceRange: v })}
            formatLabel={(v) => (v === 0 ? "0 kr" : `${v} Mkr`)}
            label="Köpeskilling"
          />
        </div>
        <div>
          <RangeSlider
            min={0}
            max={100000}
            step={1000}
            value={filters.priceRange}
            onChange={(v) => onChange({ priceRange: v })}
            formatLabel={(v) => `${v.toLocaleString("sv-SE")} kr`}
            label="Hyra per månad"
          />
        </div>
        <div>
          <RangeSlider
            min={0}
            max={1000}
            step={10}
            value={filters.sizeRange}
            onChange={(v) => onChange({ sizeRange: v })}
            formatLabel={(v) => `${v} m²`}
            label="Yta (m²)"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-2 tracking-wide uppercase">Nära till</label>
          <p className="text-[11px] text-gray-400 mb-3">Visar lokaler inom gångavstånd</p>
          <ul className="space-y-2">
            {NEAR_TO_OPTIONS.map((option) => (
              <li key={option}>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={filters.nearTo.includes(option)}
                    onChange={() => toggleNearTo(option)}
                    className="w-4 h-4 rounded border-border text-navy focus:ring-navy"
                  />
                  <span>{option}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-2 tracking-wide uppercase">Bekvämligheter</label>
          <ul className="space-y-2">
            {availableTags.map((tag) => (
              <li key={tag}>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={filters.selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="w-4 h-4 rounded border-border text-navy focus:ring-navy"
                  />
                  <span>{tag}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!compact && (
        <p className="mt-5 pt-4 border-t border-border text-xs text-gray-400">
          {loading ? "Söker..." : `${totalResults} lokaler hittades`}
        </p>
      )}
    </div>
  );
}
