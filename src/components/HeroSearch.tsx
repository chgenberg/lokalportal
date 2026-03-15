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

const PLACEHOLDER_CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Helsingborg"];

function AnimatedPlaceholder() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PLACEHOLDER_CITIES.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="absolute left-0 top-0 pointer-events-none flex items-center h-full text-white/30 text-sm sm:text-base select-none">
      <span>Sök på stad, t.ex.&nbsp;</span>
      <span
        className="transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-6px)" }}
      >
        {PLACEHOLDER_CITIES[index]}
      </span>
    </span>
  );
}

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
    <div ref={ref} className="relative w-full">
      <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm rounded-full px-4 sm:px-5 py-2.5 sm:py-3 focus-within:bg-white/[0.14] transition-all duration-300 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.15)]">
        {/* Search icon */}
        <svg className="w-5 h-5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
        </svg>

        <div className="relative flex-1 min-w-0">
          {!query && <AnimatedPlaceholder />}
          <input
            type="text"
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
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-transparent outline-none"
            aria-label="Sök stad eller område"
          />
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gold text-navy text-xs sm:text-sm font-semibold transition-all duration-300 hover:shadow-[0_4px_20px_rgba(201,169,110,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Sök bostäder"
        >
          Sök
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <ul
          role="listbox"
          aria-label="Förslag på städer"
          className="absolute top-full left-0 right-0 mt-3 bg-white/[0.95] backdrop-blur-2xl rounded-2xl border border-white/20 shadow-[0_16px_48px_rgba(0,0,0,0.2)] z-50 animate-scale-in overflow-hidden list-none m-0 p-1.5"
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
                className={`w-full text-left px-4 py-3 text-sm rounded-xl transition-all duration-200 flex items-center gap-3 ${
                  i === highlightedIndex
                    ? "bg-navy/[0.08] text-navy font-medium"
                    : "text-navy/80 hover:bg-navy/[0.04]"
                }`}
              >
                <svg className="w-4 h-4 text-navy/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                </svg>
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
