"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRightIcon, PackageIcon } from 'lucide-react';

export type ProductVariant = {
  code: string;
  location: string;
  stock: number;
  rop: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit?: string;
  stock: number;
  stockUnit: string;
  lowStockThreshold: number;
  image?: string | null;
  addedAt?: string;
  sku?: string;
  supplier?: string;
  variants: ProductVariant[];
};

type ProductCardProps = {
  product: Product;
  index: number;
};

const easing = [0.23, 1, 0.32, 1] as const;

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function ProductCard({ product, index }: ProductCardProps) {
  const isLow = product.stock <= product.lowStockThreshold;

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: easing, delay: Math.min(index, 5) * 0.04 }}
      className="list-none"
    >
      <Link
        href={`/produk/${product.id}`}
        className={[
          'group flex w-full flex-col rounded-3xl border p-4 text-left shadow-card transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          isLow
            ? 'border-alert-100 bg-gradient-to-br from-alert-50 via-alert-50 to-alert-100 hover:to-alert-200/60 focus-visible:outline-alert-600'
            : 'border-white/70 bg-gradient-to-br from-white via-white to-brand-100 hover:to-brand-200/70 focus-visible:outline-brand-700',
        ].join(' ')}
      >
        <div className="flex gap-4">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-20 w-20 shrink-0 rounded-2xl border border-white/70 bg-white object-cover shadow-card"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-brand-50 shadow-card text-brand-500">
              <PackageIcon className="h-9 w-9" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-md bg-gradient-to-r from-brand-600 to-brand-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {product.category || 'Umum'}
            </span>
            <h3 className="mt-1.5 text-base font-extrabold leading-snug text-brand-900">
              {product.name}
            </h3>
            <p className="mt-1 text-sm font-bold text-brand-600">
              {currency.format(product.price)}
              {product.unit && (
                <span className="font-medium text-slate-500"> / {product.unit}</span>
              )}
            </p>
          </div>
        </div>

        <div
          className={[
            'mt-4 flex items-center justify-between gap-3 border-t pt-3',
            isLow ? 'border-alert-100' : 'border-brand-100',
          ].join(' ')}
        >
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className={[
                'h-4 w-4 rounded-full shrink-0 shadow-sm',
                isLow
                  ? 'bg-gradient-to-br from-alert-200 to-alert-600 ring-2 ring-alert-100'
                  : 'bg-gradient-to-br from-brand-400 to-positive-600 ring-2 ring-positive-50',
              ].join(' ')}
            />
            <span
              className={[
                'text-lg font-extrabold leading-tight',
                isLow ? 'text-alert-700' : 'text-brand-900',
              ].join(' ')}
            >
              Stok: {product.stock} {product.stockUnit || 'pcs'}
            </span>
          </span>

          <span className="flex items-center gap-2">
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                isLow
                  ? 'bg-gradient-to-r from-alert-100 to-alert-200 text-alert-700'
                  : 'bg-gradient-to-r from-positive-50 to-brand-100 text-positive-600',
              ].join(' ')}
            >
              {isLow ? 'Rendah' : 'Tersedia'}
            </span>
            <ChevronRightIcon
              className={[
                'h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5',
                isLow ? 'text-alert-600' : 'text-brand-600',
              ].join(' ')}
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
