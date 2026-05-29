"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Searchable dropdown — click to open, animations, high z-index.
 */
export default function SearchableDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  icon: Icon,
  className = "",
  align = "left",
  menuZIndex = "z-[200]",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);
  const display = selected?.label || placeholder;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(opt) {
    onChange(opt.value);
    setOpen(false);
    setQuery("");
  }

  useEffect(() => {
    if (open && btnRef.current && typeof window !== "undefined") {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open]);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
    >
      {label && <span className="sr-only">{label}</span>}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:shadow-sm"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {Icon && <Icon size={16} className="shrink-0 text-sky-600" />}
        <span className="flex-1 truncate text-left">{display}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Mobile dropdown — fixed position so it sits on top and is not clipped */}
      <div
        style={{
          top: menuPos.top,
          left: menuPos.left,
          width: Math.max(menuPos.width, 220),
        }}
        className={cn(
          `fixed z-[999] origin-top rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/30 transition-all duration-200 md:hidden`,
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="border-b border-slate-100 p-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              autoFocus={open}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <ul className="max-h-60 overflow-y-auto p-1.5" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-slate-500">No results</li>
          ) : (
            filtered.map((opt) => (
              <li key={opt.value ?? opt.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => pick(opt)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    value === opt.value
                      ? "bg-sky-50 text-sky-900"
                      : "text-slate-700 hover:bg-slate-50 hover:text-sky-800"
                  )}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Desktop dropdown */}
      <div
        className={cn(
          `absolute top-[calc(100%+8px)] ${menuZIndex} min-w-[220px] origin-top rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/30 transition-all duration-200 hidden md:block`,
          align === "right" ? "right-0" : "left-0",
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="border-b border-slate-100 p-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <ul className="max-h-56 overflow-y-auto p-1.5" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-slate-500">No results</li>
          ) : (
            filtered.map((opt) => (
              <li key={opt.value ?? opt.label}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => pick(opt)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition",
                    value === opt.value
                      ? "bg-sky-50 text-sky-900"
                      : "text-slate-700 hover:bg-slate-50 hover:text-sky-800"
                  )}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
