"use client";

import RangeSlider from "./RangeSlider";
import CustomSelect from "./CustomSelect";
import { availableTags } from "@/lib/types";

export interface FilterState {
  city: string;
  type: string;
  category: string;
  searchInput: string;
  priceRange: [number, number];
  sizeRange: [number, number];
  selectedTags: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  onClear: () => void;
  totalResults: number;
  loading: boolean;
}

const PRICE_PRESETS = [
  { label: "Under 5 000", min: 0, max: 5000 },
  { label: "5–15 000", min: 5000, max: 15000 },
  { label: "15–30 000", min: 15000, max: 30000 },
  { label: "30 000+", min: 30000, max: 200000 },
];

export default function FilterPanel({ filters, onChange, onClear, totalResults, loading }: FilterPanelProps) {
  const hasFilters =
    filters.city || filters.type || filters.category || filters.selectedTags.length > 0 ||
    filters.priceRange[0] > 0 || filters.priceRange[1] < 200000 ||
    filters.sizeRange[0] > 0 || filters.sizeRange[1] < 2000;

  const toggleTag = (tag: string) => {
    const selected = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onChange({ selectedTags: selected });
  };

  return (
    <div className="mb-8 p-6 bg-muted rounded-2xl border border-border animate-slide-down">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-medium text-navy">
          {loading ? "Söker..." : `${totalResults} lokaler matchar`}
        </p>
        {hasFilters && (
          <button onClick={onClear} className="text-sm text-gray-500 hover:text-navy transition-colors">
            Rensa alla filter &times;
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">Stad</label>
          <input
            type="text"
            placeholder="Alla städer"
            value={filters.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full px-4 py-2.5 bg-white rounded-lg text-sm border border-border focus:border-navy outline-none"
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
        <CustomSelect
          label="Kategori"
          value={filters.category}
          onChange={(v) => onChange({ category: v })}
          placeholder="Alla kategorier"
          options={[
            { value: "", label: "Alla kategorier" },
            { value: "butik", label: "Butik" },
            { value: "kontor", label: "Kontor" },
            { value: "lager", label: "Lager" },
            { value: "ovrigt", label: "Övrigt" },
          ]}
        />
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {PRICE_PRESETS.map((preset) => {
            const active = filters.priceRange[0] === preset.min && filters.priceRange[1] === preset.max;
            return (
              <button
                key={preset.label}
                onClick={() => onChange({ priceRange: [preset.min, preset.max] })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active ? "bg-navy text-white" : "bg-white border border-border text-gray-600 hover:border-navy hover:text-navy"
                }`}
              >
                {preset.label} kr/mån
              </button>
            );
          })}
        </div>
        <RangeSlider
          min={0} max={200000} step={1000}
          value={filters.priceRange}
          onChange={(v) => onChange({ priceRange: v })}
          formatLabel={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)} mkr` : `${(v / 1000).toFixed(0)}k kr`}
          label="Pris"
        />
      </div>

      <div className="mb-6">
        <RangeSlider
          min={0} max={2000} step={10}
          value={filters.sizeRange}
          onChange={(v) => onChange({ sizeRange: v })}
          formatLabel={(v) => `${v} m²`}
          label="Storlek"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Egenskaper</label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const active = filters.selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active ? "bg-navy text-white" : "bg-white border border-border text-gray-600 hover:border-navy hover:text-navy"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {hasFilters && (
        <div className="mt-5 pt-5 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {filters.city && <ActiveChip label={`Stad: ${filters.city}`} onRemove={() => onChange({ city: "" })} />}
            {filters.type && <ActiveChip label={filters.type === "sale" ? "Till salu" : "Uthyres"} onRemove={() => onChange({ type: "" })} />}
            {filters.category && <ActiveChip label={{ butik: "Butik", kontor: "Kontor", lager: "Lager", ovrigt: "Övrigt" }[filters.category] ?? filters.category} onRemove={() => onChange({ category: "" })} />}
            {(filters.priceRange[0] > 0 || filters.priceRange[1] < 200000) && <ActiveChip label={`Pris: ${(filters.priceRange[0] / 1000).toFixed(0)}k–${(filters.priceRange[1] / 1000).toFixed(0)}k`} onRemove={() => onChange({ priceRange: [0, 200000] })} />}
            {(filters.sizeRange[0] > 0 || filters.sizeRange[1] < 2000) && <ActiveChip label={`Storlek: ${filters.sizeRange[0]}–${filters.sizeRange[1]} m²`} onRemove={() => onChange({ sizeRange: [0, 2000] })} />}
            {filters.selectedTags.map((tag) => <ActiveChip key={tag} label={tag} onRemove={() => toggleTag(tag)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy/10 text-navy text-xs font-medium rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-navy-light transition-colors" aria-label={`Ta bort filter: ${label}`}>&times;</button>
    </span>
  );
}
