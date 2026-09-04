"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRightIcon, TrendingUpIcon } from 'lucide-react';
import Link from 'next/link';
import type { DayPoint } from './StockChart';

type RevenueCardProps = {
  revenue: number;
  productsSold: number;
  delta: number;
  trend: DayPoint[];
};

const easing = [0.23, 1, 0.32, 1] as const;

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function RevenueCard({ revenue, productsSold, delta, trend }: RevenueCardProps) {
  const max = Math.max(...trend.map((d) => d.value), 1);

  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-800 to-brand-900 text-white shadow-lift"
      aria-labelledby="revenue-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-b from-brand-400/40 to-transparent blur-2xl"
      />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id="revenue-title" className="text-sm font-semibold text-brand-200">
            Total Terjual &amp; Pendapatan
          </h2>
          {delta !== undefined && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs font-bold text-white">
              <TrendingUpIcon className="h-3.5 w-3.5" />
              {delta >= 0 ? `+${delta}%` : `${delta}%`}
            </span>
          )}
        </div>

        <p className="mt-3 text-3xl font-extrabold tracking-tight">{currency.format(revenue)}</p>
        <p className="mt-1 text-sm font-medium text-brand-200">
          dari {productsSold} produk terjual
        </p>

        <ul className="mt-5 flex h-16 items-end gap-1.5" aria-hidden="true">
          {trend.map((point, index) => {
            const heightPct = (point.value / max) * 100;
            return (
              <li key={`${point.label}-${index}`} className="flex h-full flex-1 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, heightPct)}%` }}
                  transition={{ duration: 0.3, ease: easing, delay: 0.1 + index * 0.04 }}
                  className={[
                    'w-full rounded-md bg-gradient-to-t',
                    index === trend.length - 1
                      ? 'from-brand-300 to-white/90'
                      : 'from-white/10 to-white/35',
                  ].join(' ')}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <Link
        href="/pemilik/rekap/penjualan"
        className="relative flex w-full items-center justify-between border-t border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-brand-200 transition-colors duration-150 ease-out hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-300"
      >
        Lihat detail rekap
        <ChevronRightIcon className="h-4 w-4" />
      </Link>
    </section>
  );
}
