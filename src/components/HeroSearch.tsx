"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/useDebounce";

const SWEDISH_CITIES = [
  "Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping", "Västerås",
  "Örebro", "Norrköping", "Helsingborg", "Jönköping", "Umeå", "Lund",
  "Borås", "Sundsvall", "Gävle", "Eskilstuna", "Halmstad", "Växjö",
  "Karlstad", "Södertälje", "Täby", "Trollhättan", "Luleå", "Kalmar",
  "Falun", "Kristianstad", "Skellefteå", "Uddevalla", "Nyköping",
  "Skövde", "Varberg", "Östersund", "Karlskrona", "Borlänge",
  "Tumba", "Motala", "Landskrona", "Lidköping", "Visby",
];

export default function HeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedCity = useDebounce(city, 300);

  useEffect(() => { setHighlightedIndex(-1); }, [citySuggestions]);

  useEffect(() => {
    if (debouncedCity.length >= 3) {
      const filtered = SWEDISH_CITIES.filter((c) => c.toLowerCase().startsWith(debouncedCity.toLowerCase()));
      setCitySuggestions(filtered);
      setShowCitySuggestions(filtered.length > 0);
    } else { setCitySuggestions([]); setShowCitySuggestions(false); }
  }, [debouncedCity]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCitySuggestions(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    router.push(`/annonser?${params.toString()}`);
  };

  const typeOptions = [
    { value: "", label: "Alla typer" },
    { value: "sale", label: "Till salu" },
    { value: "rent", label: "Uthyres" },
  ];

  const categoryOptions = [
    { value: "", label: "Alla kategorier" },
    { value: "butik", label: "Butik" },
    { value: "kontor", label: "Kontor" },
    { value: "lager", label: "Lager" },
    { value: "ovrigt", label: "Övrigt" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="glass rounded-2xl border border-white/20 p-2 flex flex-col md:flex-row gap-2 glow-strong">
        {/* City */}
        <div ref={cityRef} className="relative flex-1">
          <div className="flex items-center px-4 py-3 rounded-xl bg-white/60 hover:bg-white/80 transition-colors">
            <input
              type="text"
              placeholder="Sök stad..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => city.length >= 3 && setShowCitySuggestions(true)}
              onKeyDown={(e) => {
                if (!showCitySuggestions || citySuggestions.length === 0) return;
                if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex((i) => (i < citySuggestions.length - 1 ? i + 1 : 0)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIndex((i) => (i > 0 ? i - 1 : citySuggestions.length - 1)); }
                else if (e.key === "Enter" && highlightedIndex >= 0 && citySuggestions[highlightedIndex]) { e.preventDefault(); setCity(citySuggestions[highlightedIndex]); setShowCitySuggestions(false); setHighlightedIndex(-1); }
                else if (e.key === "Escape") { setShowCitySuggestions(false); setHighlightedIndex(-1); }
              }}
              className="w-full bg-transparent text-sm text-navy placeholder-gray-400 outline-none"
              aria-label="Sök stad"
            />
          </div>
          {showCitySuggestions && (
            <ul className="absolute top-full left-0 right-0 mt-1.5 glass rounded-xl border border-border/60 shadow-xl z-50 animate-scale-in overflow-hidden list-none m-0 p-0">
              {citySuggestions.map((suggestion, i) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => { setCity(suggestion); setShowCitySuggestions(false); }}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all ${i === highlightedIndex ? "bg-navy/[0.04] text-navy font-medium" : "text-gray-600 hover:bg-navy/[0.02]"}`}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Type */}
        <div ref={typeRef} className="relative w-full md:w-40">
          <button
            type="button"
            onClick={() => { setTypeOpen(!typeOpen); setCategoryOpen(false); }}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/60 hover:bg-white/80 transition-colors text-sm"
          >
            <span className={type ? "text-navy font-medium" : "text-gray-400"}>
              {type ? typeOptions.find((o) => o.value === type)?.label : "Typ"}
            </span>
            <span className={`text-gray-300 text-[10px] transition-transform ${typeOpen ? "rotate-180" : ""}`}>&#9662;</span>
          </button>
          {typeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 glass rounded-xl border border-border/60 shadow-xl z-50 animate-scale-in overflow-hidden">
              {typeOptions.map((opt) => (
                <button type="button" key={opt.value}
                  onClick={() => { setType(opt.value); setTypeOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all ${type === opt.value ? "bg-navy/[0.04] text-navy font-medium" : "text-gray-600 hover:bg-navy/[0.02]"}`}
                >{opt.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div ref={categoryRef} className="relative w-full md:w-40">
          <button
            type="button"
            onClick={() => { setCategoryOpen(!categoryOpen); setTypeOpen(false); }}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-white/60 hover:bg-white/80 transition-colors text-sm"
          >
            <span className={category ? "text-navy font-medium" : "text-gray-400"}>
              {category ? categoryOptions.find((o) => o.value === category)?.label : "Kategori"}
            </span>
            <span className={`text-gray-300 text-[10px] transition-transform ${categoryOpen ? "rotate-180" : ""}`}>&#9662;</span>
          </button>
          {categoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 glass rounded-xl border border-border/60 shadow-xl z-50 animate-scale-in overflow-hidden">
              {categoryOptions.map((opt) => (
                <button type="button" key={opt.value}
                  onClick={() => { setCategory(opt.value); setCategoryOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-all ${category === opt.value ? "bg-navy/[0.04] text-navy font-medium" : "text-gray-600 hover:bg-navy/[0.02]"}`}
                >{opt.label}</button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="btn-glow px-7 py-3 bg-navy text-white rounded-xl text-sm font-semibold shrink-0 tracking-wide"
        >
          Sök
        </button>
      </div>
    </div>
  );
}
