"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export type MovementType = 'Masuk' | 'Keluar' | 'masuk' | 'keluar';

export type StockMovementItem = {
  id: string;
  productName: string;
  variant: string;
  date: string;
  time: string;
  quantity: number;
  type: MovementType;
};

type StockMovementListProps = {
  movements: StockMovementItem[];
};

const easing = [0.23, 1, 0.32, 1] as const;

export function StockMovementList({ movements }: StockMovementListProps) {
  if (!movements || movements.length === 0) {
    return (
      <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-6 text-center shadow-card">
        <p className="text-sm font-medium text-slate-500">Belum ada pergerakan stok tercatat.</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 shadow-card">
      {movements.map((movement, index) => {
        const isIn = movement.type.toLowerCase() === 'masuk';
        return (
          <motion.li
            key={movement.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: easing, delay: Math.min(index, 5) * 0.04 }}
            className={[
              'flex items-center gap-3 px-4 py-3.5',
              index > 0 ? 'border-t border-brand-100' : '',
            ].join(' ')}
          >
            <span
              aria-hidden="true"
              className={[
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border',
                isIn
                  ? 'border-positive-600/20 bg-gradient-to-br from-positive-50 to-brand-100'
                  : 'border-alert-100 bg-gradient-to-br from-alert-50 to-alert-100',
              ].join(' ')}
            >
              {isIn ? (
                <TrendingUpIcon className="h-5 w-5 text-positive-600" strokeWidth={2.4} />
              ) : (
                <TrendingDownIcon className="h-5 w-5 text-alert-600" strokeWidth={2.4} />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold text-brand-900">
                {movement.productName}
              </p>
              <p className="truncate text-xs font-medium text-slate-600">
                Varian: {movement.variant}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                {movement.date} {movement.time ? `· ${movement.time}` : ''}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p
                className={[
                  'text-lg font-extrabold leading-none',
                  isIn ? 'text-positive-600' : 'text-alert-700',
                ].join(' ')}
              >
                {isIn ? '+' : '−'}
                {movement.quantity}
              </p>
              <span
                className={[
                  'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  isIn
                    ? 'bg-gradient-to-r from-positive-50 to-brand-100 text-positive-600'
                    : 'bg-gradient-to-r from-alert-100 to-alert-200 text-alert-700',
                ].join(' ')}
              >
                {isIn ? 'Masuk' : 'Keluar'}
              </span>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
