"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown } from "lucide-react";

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

  useEffect(() => {
    if (city.length >= 3) {
      const filtered = SWEDISH_CITIES.filter((c) =>
        c.toLowerCase().startsWith(city.toLowerCase())
      );
      setCitySuggestions(filtered);
      setShowCitySuggestions(filtered.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
    }
  }, [city]);

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
            <MapPin className="w-5 h-5 text-accent shrink-0" />
            <input
              type="text"
              placeholder="Sök stad..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => city.length >= 3 && setShowCitySuggestions(true)}
              className="w-full bg-transparent text-sm text-foreground placeholder-gray-400 outline-none"
            />
          </div>
          {showCitySuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border z-50 animate-slide-down overflow-hidden">
              {citySuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setCity(suggestion);
                    setShowCitySuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type Dropdown */}
        <div ref={typeRef} className="relative w-full md:w-44">
          <button
            onClick={() => {
              setTypeOpen(!typeOpen);
              setCategoryOpen(false);
            }}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted-dark transition-colors text-sm"
          >
            <span className={type ? "text-foreground" : "text-gray-400"}>
              {type ? typeOptions.find((o) => o.value === type)?.label : "Typ"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${typeOpen ? "rotate-180" : ""}`} />
          </button>
          {typeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border z-50 animate-slide-down overflow-hidden">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
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
            onClick={() => {
              setCategoryOpen(!categoryOpen);
              setTypeOpen(false);
            }}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted-dark transition-colors text-sm"
          >
            <span className={category ? "text-foreground" : "text-gray-400"}>
              {category
                ? categoryOptions.find((o) => o.value === category)?.label
                : "Kategori"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
          </button>
          {categoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-border z-50 animate-slide-down overflow-hidden">
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
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
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white rounded-xl hover:bg-navy-light transition-all text-sm font-medium shrink-0 hover:shadow-lg"
        >
          <Search className="w-4 h-4" />
          <span>Sök</span>
        </button>
      </div>
    </div>
  );
}
