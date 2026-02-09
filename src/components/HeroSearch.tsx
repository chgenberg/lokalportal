"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";
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

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [citySuggestions]);

  useEffect(() => {
    if (debouncedCity.length >= 3) {
      const filtered = SWEDISH_CITIES.filter((c) =>
        c.toLowerCase().startsWith(debouncedCity.toLowerCase())
      );
      setCitySuggestions(filtered);
      setShowCitySuggestions(filtered.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  }, [debouncedCity]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-border p-2 flex flex-col md:flex-row gap-2">
        {/* City Search */}
        <div ref={cityRef} className="relative flex-1">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted-dark transition-colors">
            <MapPin className="w-5 h-5 text-accent shrink-0" aria-hidden />
            <input
              type="text"
              placeholder="Sök stad..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => city.length >= 3 && setShowCitySuggestions(true)}
              onKeyDown={(e) => {
                if (!showCitySuggestions || citySuggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightedIndex((i) => (i < citySuggestions.length - 1 ? i + 1 : 0));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightedIndex((i) => (i > 0 ? i - 1 : citySuggestions.length - 1));
                } else if (e.key === "Enter" && highlightedIndex >= 0 && citySuggestions[highlightedIndex]) {
                  e.preventDefault();
                  setCity(citySuggestions[highlightedIndex]);
                  setShowCitySuggestions(false);
                  setHighlightedIndex(-1);
                } else if (e.key === "Escape") {
                  setShowCitySuggestions(false);
                  setHighlightedIndex(-1);
                }
              }}
              className="w-full bg-transparent text-sm text-foreground placeholder-gray-400 outline-none"
              aria-label="Sök stad"
              aria-autocomplete="list"
              aria-controls={showCitySuggestions ? "city-suggestions" : undefined}
              aria-expanded={showCitySuggestions}
              aria-activedescendant={highlightedIndex >= 0 && citySuggestions[highlightedIndex] ? `city-option-${highlightedIndex}` : undefined}
            />
          </div>
          {showCitySuggestions && (
            <ul
              id="city-suggestions"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border z-50 animate-slide-down overflow-hidden list-none m-0 p-0"
            >
              {citySuggestions.map((suggestion, i) => (
                <li key={suggestion} role="option" id={`city-option-${i}`} aria-selected={i === highlightedIndex}>
                  <button
                    type="button"
                    onClick={() => {
                      setCity(suggestion);
                      setShowCitySuggestions(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${i === highlightedIndex ? "bg-muted text-accent" : "hover:bg-muted"}`}
                  >
                    <MapPin className="w-4 h-4 text-gray-400" aria-hidden />
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Type Dropdown */}
        <div ref={typeRef} className="relative w-full md:w-44">
          <button
            type="button"
            onClick={() => {
              setTypeOpen(!typeOpen);
              setCategoryOpen(false);
            }}
            aria-expanded={typeOpen}
            aria-haspopup="listbox"
            aria-label="Välj typ av annons"
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted-dark transition-colors text-sm"
          >
            <span className={type ? "text-foreground" : "text-gray-400"}>
              {type ? typeOptions.find((o) => o.value === type)?.label : "Typ"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${typeOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {typeOpen && (
            <div role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border z-50 animate-slide-down overflow-hidden">
              {typeOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  role="option"
                  aria-selected={type === opt.value}
                  onClick={() => {
                    setType(opt.value);
                    setTypeOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    type === opt.value ? "bg-muted text-accent font-medium" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Dropdown */}
        <div ref={categoryRef} className="relative w-full md:w-44">
          <button
            type="button"
            onClick={() => {
              setCategoryOpen(!categoryOpen);
              setTypeOpen(false);
            }}
            aria-expanded={categoryOpen}
            aria-haspopup="listbox"
            aria-label="Välj kategori"
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted-dark transition-colors text-sm"
          >
            <span className={category ? "text-foreground" : "text-gray-400"}>
              {category
                ? categoryOptions.find((o) => o.value === category)?.label
                : "Kategori"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${categoryOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {categoryOpen && (
            <div role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border z-50 animate-slide-down overflow-hidden">
              {categoryOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  role="option"
                  aria-selected={category === opt.value}
                  onClick={() => {
                    setCategory(opt.value);
                    setCategoryOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    category === opt.value ? "bg-muted text-accent font-medium" : ""
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          type="button"
          onClick={handleSearch}
          aria-label="Sök lokaler"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white rounded-xl hover:bg-navy-light transition-all text-sm font-medium shrink-0 hover:shadow-lg"
        >
          <Search className="w-4 h-4" />
          <span>Sök</span>
        </button>
      </div>
    </div>
  );
}
