"use client";

import React from 'react';
import { motion } from 'framer-motion';

export type DayPoint = {
  label: string;
  value: number;
};

type StockChartProps = {
  data: DayPoint[];
  total: number;
};

const easing = [0.23, 1, 0.32, 1] as const;

export function StockChart({ data, total }: StockChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const average = data.length > 0 ? data.reduce((sum, d) => sum + d.value, 0) / data.length : 0;
  const todayIndex = data.length - 1;

  return (
    <section
      className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-5 shadow-card"
      aria-labelledby="stock-chart-title"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="stock-chart-title" className="text-sm font-bold text-brand-900">
            Total Barang Keluar
          </h2>
          <p className="text-xs font-medium text-slate-500">7 hari terakhir</p>
        </div>
        <p className="text-4xl font-extrabold leading-none tracking-tight text-brand-900">
          {total}
        </p>
      </div>

      <div className="relative mt-6 h-40">
        {average > 0 && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-brand-300 pointer-events-none"
            style={{ bottom: `${Math.min(100, Math.max(0, (average / max) * 100))}%` }}
            aria-hidden="true"
          >
            <span className="absolute -top-2.5 right-0 rounded-full bg-brand-50 px-1.5 text-[10px] font-bold text-brand-600">
              rata-rata {Math.round(average)}
            </span>
          </div>
        )}
        <ul className="flex h-full items-end gap-2">
          {data.map((point, index) => {
            const isToday = index === todayIndex;
            const barHeight = max > 0 ? (point.value / max) * 100 : 0;
            return (
              <li key={`${point.label}-${index}`} className="flex h-full flex-1 flex-col justify-end">
                {isToday && (
                  <span className="mb-1 text-center text-[11px] font-bold text-brand-700">
                    {point.value}
                  </span>
                )}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, barHeight)}%` }}
                  transition={{ duration: 0.3, ease: easing, delay: index * 0.04 }}
                  className={[
                    'w-full rounded-t-lg bg-gradient-to-t',
                    isToday
                      ? 'from-brand-900 to-brand-500 shadow-lift'
                      : 'from-brand-300 to-brand-100',
                  ].join(' ')}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <ul className="mt-2 flex gap-2" aria-hidden="true">
        {data.map((point, index) => (
          <li
            key={`${point.label}-${index}`}
            className={[
              'flex-1 text-center text-[11px]',
              index === todayIndex ? 'font-bold text-brand-700' : 'font-medium text-slate-500',
            ].join(' ')}
          >
            {point.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
