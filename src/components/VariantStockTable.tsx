"use client";

import React from 'react';

export type ProductVariant = {
  code: string;
  location: string;
  stock: number;
  rop: number;
};

type VariantStockTableProps = {
  variants: ProductVariant[];
};

export function VariantStockTable({ variants }: VariantStockTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 shadow-card">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Rincian stok per varian</caption>
        <thead>
          <tr className="bg-gradient-to-r from-brand-100 to-brand-200/70">
            <th scope="col" className="px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-brand-700">
              Varian
            </th>
            <th scope="col" className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-brand-700">
              Stok
            </th>
            <th scope="col" className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-brand-700">
              ROP
            </th>
            <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-brand-700">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant, idx) => {
            const isLow = variant.stock <= variant.rop;
            return (
              <tr
                key={`${variant.code}-${idx}`}
                className={[
                  'border-t',
                  isLow
                    ? 'border-alert-100 bg-gradient-to-r from-alert-50 to-alert-50/40'
                    : 'border-brand-100',
                ].join(' ')}
              >
                <th scope="row" className="px-4 py-3 font-bold text-brand-900">
                  <span className="block text-sm">{variant.code}</span>
                  <span className="block text-[11px] font-medium text-slate-500">
                    Lokasi: {variant.location || '-'}
                  </span>
                </th>
                <td className="px-2 py-3 text-center">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={[
                        'h-2 w-2 rounded-full',
                        isLow
                          ? 'bg-gradient-to-br from-alert-200 to-alert-600'
                          : 'bg-gradient-to-br from-brand-400 to-positive-600',
                      ].join(' ')}
                    />
                    <span
                      className={[
                        'text-sm font-bold',
                        isLow ? 'text-alert-700' : 'text-brand-900',
                      ].join(' ')}
                    >
                      {variant.stock}
                    </span>
                  </span>
                </td>
                <td className="px-2 py-3 text-center text-sm font-semibold text-brand-600">
                  {variant.rop}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={[
                      'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      isLow
                        ? 'bg-gradient-to-r from-alert-100 to-alert-200 text-alert-700'
                        : 'bg-gradient-to-r from-positive-50 to-brand-100 text-positive-600',
                    ].join(' ')}
                  >
                    {isLow ? 'Rendah' : 'Aman'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
