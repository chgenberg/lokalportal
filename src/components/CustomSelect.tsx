"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  label?: string;
  id?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder = "Välj...", className = "", label, id }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 tracking-[0.1em] uppercase">{label}</label>
      )}
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm border transition-all duration-200 ${
          open
            ? "border-navy/30 bg-white shadow-sm"
            : "border-border/60 bg-muted/50 hover:border-navy/20 hover:bg-white"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={selected ? "text-navy font-medium" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={`text-gray-300 text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>&#9662;</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-border/60 shadow-xl z-50 animate-scale-in overflow-hidden" role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-all ${
                value === opt.value
                  ? "bg-navy/[0.04] text-navy font-medium"
                  : "text-gray-600 hover:bg-navy/[0.02] hover:text-navy"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
