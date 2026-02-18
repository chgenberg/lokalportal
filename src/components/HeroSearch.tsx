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
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => setHighlightedIndex(-1), [suggestions]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      const filtered = SWEDISH_CITIES.filter((c) =>
        c.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("city", query.trim());
    router.push(`/annonser?${params.toString()}`);
  };

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 bg-muted/60 border border-border/60 rounded-full px-4 py-3 focus-within:border-navy/20 focus-within:bg-white transition-colors shadow-sm">
        <input
          type="text"
          placeholder="Sök på stad eller område"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (showSuggestions && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                setQuery(suggestions[highlightedIndex]);
                setShowSuggestions(false);
              } else handleSearch();
            }
            if (!showSuggestions || suggestions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
            } else if (e.key === "Escape") setShowSuggestions(false);
          }}
          className="flex-1 min-w-0 bg-transparent text-sm text-navy placeholder-gray-400 outline-none"
          aria-label="Sök stad eller område"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="w-10 h-10 rounded-full bg-gold text-navy flex items-center justify-center shrink-0 transition-all duration-200 hover:shadow-md hover:opacity-90"
          aria-label="Sök lokaler"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
        </button>
      </div>
      {showSuggestions && (
        <ul
          role="listbox"
          aria-label="Förslag på städer"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border/60 shadow-xl z-50 animate-scale-in overflow-hidden list-none m-0 p-1"
        >
          {suggestions.map((suggestion, i) => (
            <li key={suggestion} role="option" aria-selected={i === highlightedIndex}>
              <button
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  setShowSuggestions(false);
                  router.push(`/annonser?city=${encodeURIComponent(suggestion)}`);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all ${i === highlightedIndex ? "bg-navy/[0.06] text-navy font-medium" : "text-navy hover:bg-navy/[0.04]"}`}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
