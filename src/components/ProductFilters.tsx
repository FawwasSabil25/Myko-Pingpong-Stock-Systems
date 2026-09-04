"use client";

import React from 'react';
import { SearchIcon } from 'lucide-react';

type ProductFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  resultCount: number;
};

export function ProductFilters({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
  categories,
  resultCount,
}: ProductFiltersProps) {
  return (
    <section
      aria-label="Filter produk"
      className="rounded-3xl border border-white/60 bg-gradient-to-br from-brand-300 via-brand-200 to-brand-100 p-4 shadow-card"
    >
      <label className="relative block">
        <span className="sr-only">Cari nama produk</span>
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Cari nama produk..."
          className="w-full rounded-2xl border border-white/70 bg-gradient-to-b from-white to-brand-50 py-3 pl-12 pr-4 text-sm font-medium text-brand-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
        />
      </label>

      {categories.length > 0 && (
        <ul className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <li key={category} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onCategoryChange(category)}
                  className={[
                    'rounded-full px-4 py-2 text-xs font-bold transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer',
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-900 text-white shadow-lift'
                      : 'bg-white/85 text-brand-700 hover:bg-white',
                  ].join(' ')}
                >
                  {category}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs font-semibold text-brand-700">
        {resultCount} produk ditampilkan
      </p>
    </section>
  );
}
