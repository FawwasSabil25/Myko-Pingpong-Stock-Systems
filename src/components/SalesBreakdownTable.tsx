"use client";

import React from 'react';
import { PackageIcon } from 'lucide-react';

export type SalesRow = {
  id: string;
  name: string;
  sold: number;
  revenue: string;
  image?: string | null;
};

type SalesBreakdownTableProps = {
  rows: SalesRow[];
};

export function SalesBreakdownTable({ rows }: SalesBreakdownTableProps) {
  return (
    <section
      className="overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 shadow-card"
      aria-labelledby="sales-detail-title"
    >
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-brand-100 to-brand-200/70 px-4 py-3.5">
        <h2
          id="sales-detail-title"
          className="text-base font-extrabold tracking-tight text-brand-900"
        >
          Rincian Penjualan Produk
        </h2>
      </div>

      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Rincian penjualan per produk</caption>
        <thead>
          <tr className="border-b border-brand-100">
            <th
              scope="col"
              className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-brand-700"
            >
              Nama Produk
            </th>
            <th
              scope="col"
              className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-brand-700"
            >
              Terjual
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-brand-700"
            >
              Pendapatan
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-sm font-medium text-slate-500">
                Belum ada data penjualan pada periode ini.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id} className={index > 0 ? 'border-t border-brand-100' : ''}>
                <th scope="row" className="px-4 py-3 font-normal">
                  <span className="flex items-center gap-3">
                    {row.image ? (
                      <img
                        src={row.image}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-xl border border-white/70 bg-white object-cover shadow-card"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-brand-50 text-brand-600 shadow-card">
                        <PackageIcon className="h-5 w-5" />
                      </span>
                    )}
                    <span className="text-sm font-bold leading-snug text-brand-900">{row.name}</span>
                  </span>
                </th>
                <td className="px-2 py-3 text-center text-sm font-extrabold text-brand-900">
                  {row.sold}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-brand-600">
                  {row.revenue}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
