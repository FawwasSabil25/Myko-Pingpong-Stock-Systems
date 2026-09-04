"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';

export type HistoryItem = {
  id: string;
  productName: string;
  variant: string;
  date: string;
  time: string;
  timezone?: string;
  quantity: number;
  type: string;
  reference?: string;
};

type StockHistoryListProps = {
  entries: HistoryItem[];
  rangeStart: number;
  rangeEnd: number;
  totalEntries: number;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
};

const easing = [0.23, 1, 0.32, 1] as const;

export function StockHistoryList({
  entries,
  rangeStart,
  rangeEnd,
  totalEntries,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: StockHistoryListProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-6 text-center shadow-card">
        <p className="text-sm font-medium text-slate-500">Belum ada riwayat pergerakan stok.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 shadow-card">
      <ul>
        {entries.map((entry, index) => {
          const isIn = entry.type.toLowerCase() === 'masuk';
          return (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: easing, delay: Math.min(index, 5) * 0.04 }}
              className={[
                'relative px-4 py-4',
                index > 0 ? 'border-t border-brand-100' : '',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b',
                  isIn
                    ? 'from-positive-600/70 to-brand-400/60'
                    : 'from-alert-600/70 to-alert-200/70',
                ].join(' ')}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500">
                    {entry.date} {entry.time ? `· ${entry.time}` : ''} {entry.timezone || 'WIB'}
                  </p>
                  <h3 className="mt-1 text-base font-extrabold leading-snug text-brand-900">
                    {entry.productName}
                  </h3>
                  <p className="text-xs font-medium text-slate-600">{entry.variant}</p>
                  <span
                    className={[
                      'mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
                      isIn
                        ? 'bg-gradient-to-r from-positive-50 to-brand-100 text-positive-600'
                        : 'bg-gradient-to-r from-alert-50 to-alert-100 text-alert-700',
                    ].join(' ')}
                  >
                    {isIn ? (
                      <ArrowDownLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <ArrowUpRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {isIn ? 'Masuk' : 'Keluar'}
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={[
                      'text-xl font-extrabold leading-none',
                      isIn ? 'text-positive-600' : 'text-alert-700',
                    ].join(' ')}
                  >
                    {isIn ? '+' : '−'}
                    {entry.quantity}
                  </p>
                  {entry.reference && (
                    <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {entry.reference}
                    </p>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-brand-100 bg-gradient-to-r from-brand-50 to-brand-100 px-4 py-3">
        <p className="text-xs font-semibold text-brand-700">
          Menampilkan {rangeStart}-{rangeEnd} dari {totalEntries} data
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            onClick={onBack}
            disabled={!canGoBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-brand-700 transition-colors duration-150 ease-out hover:bg-white disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
          >
            <ChevronLeftIcon className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            aria-label="Halaman berikutnya"
            onClick={onForward}
            disabled={!canGoForward}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-900 text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
          >
            <ChevronRightIcon className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
