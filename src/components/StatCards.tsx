"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangleIcon, ChevronRightIcon, ShoppingCartIcon } from 'lucide-react';
import Link from 'next/link';

type StatCardsProps = {
  lowStockCount: number;
  lowStockItems?: string[];
  activeOrders: number;
};

const easing = [0.23, 1, 0.32, 1] as const;

export function StatCards({
  lowStockCount,
  activeOrders
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-5 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easing }}
        className="col-span-3 flex flex-col rounded-3xl border border-alert-100 bg-gradient-to-br from-alert-50 via-alert-50 to-alert-100 p-4 text-left shadow-card"
      >
        <Link href="/produk" className="flex flex-col h-full group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert-600 rounded-2xl">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-alert-600" strokeWidth={2.4} />
            <span className="text-sm font-bold text-alert-700">Stok Menipis</span>
          </div>
          <p className="mt-2 text-4xl font-extrabold leading-none text-alert-700">
            {lowStockCount}
            <span className="ml-1 text-base font-bold">item</span>
          </p>
          <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-bold text-alert-600 group-hover:underline">
            Restok sekarang
            <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: easing, delay: 0.05 }}
        className="col-span-2 flex flex-col rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200 p-4 text-left shadow-card"
      >
        <Link href="/pemilik/pesanan" className="flex flex-col h-full group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 rounded-2xl">
          <div className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5 text-brand-600" strokeWidth={2.4} />
            <span className="text-sm font-bold text-brand-700">Pesanan</span>
          </div>
          <p className="mt-2 text-4xl font-extrabold leading-none text-brand-700">{activeOrders}</p>
          <p className="mt-1 text-xs font-semibold text-brand-600">menunggu diproses</p>
          <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-bold text-brand-600 group-hover:underline">
            Lihat antrean
            <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </motion.div>
    </div>
  );
}
