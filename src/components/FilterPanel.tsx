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
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${compact ? "p-5" : "p-5"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-navy">Filter</h2>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClear} className="text-sm text-gray-400 hover:text-navy font-medium transition-colors">
            Rensa alla
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-navy rounded-full transition-colors" aria-label="Stäng filter">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {compact ? (
        <>
          {/* Compact: horizontal grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">Stad</label>
              <input
                type="text"
                placeholder="Alla städer"
                value={filters.city}
                onChange={(e) => onChange({ city: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:border-navy/30 outline-none transition-all"
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
          </div>

          {/* Category chips */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-gray-400 mb-2 tracking-wide uppercase">Kategori</label>
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? "bg-navy text-white border-navy"
                        : "bg-white text-gray-500 border-gray-200 hover:border-navy/20 hover:text-navy"
                    }`}
                  >
                    {categoryLabels[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags + Near to in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-2 tracking-wide uppercase">Nära till</label>
              <div className="flex flex-wrap gap-1.5">
                {NEAR_TO_OPTIONS.map((option) => {
                  const active = filters.nearTo.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleNearTo(option)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        active
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-gray-500 border-gray-200 hover:border-navy/20 hover:text-navy"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-2 tracking-wide uppercase">Bekvämligheter</label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const active = filters.selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        active
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-gray-500 border-gray-200 hover:border-navy/20 hover:text-navy"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {loading ? "Söker..." : `${totalResults} lokaler hittades`}
            </p>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-navy text-white text-sm font-medium rounded-full transition-all hover:shadow-md"
              >
                Visa resultat
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Full sidebar layout */}
          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-wide uppercase">Stad</label>
              <input
                type="text"
                placeholder="Alla städer"
                value={filters.city}
                onChange={(e) => onChange({ city: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:border-navy/30 outline-none transition-all"
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
              <label className="block text-[11px] font-semibold text-gray-400 mb-2 tracking-wide uppercase">Kategori</label>
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
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        active
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-gray-500 border-gray-200 hover:border-navy/20 hover:text-navy"
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
              <label className="block text-[11px] font-semibold text-gray-400 mb-2 tracking-wide uppercase">Nära till</label>
              <div className="flex flex-wrap gap-1.5">
                {NEAR_TO_OPTIONS.map((option) => {
                  const active = filters.nearTo.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleNearTo(option)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        active
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-gray-500 border-gray-200 hover:border-navy/20 hover:text-navy"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-2 tracking-wide uppercase">Bekvämligheter</label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const active = filters.selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        active
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-gray-500 border-gray-200 hover:border-navy/20 hover:text-navy"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400">
            {loading ? "Söker..." : `${totalResults} lokaler hittades`}
          </p>
        </>
      )}
    </div>
  );
}
