"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRightIcon, ClockIcon, PackageIcon, ShoppingBasketIcon, TruckIcon } from "lucide-react";

export type OrderStatus = 'baru' | 'dikirim' | 'selesai' | 'Menunggu Konfirmasi' | 'Diproses' | 'Siap Kirim';

export type OrderItem = {
  id: string;
  customer: string;
  status: OrderStatus | string;
  productName: string;
  productNote?: string;
  quantity: string;
  total: number;
  placedAt: string;
  image?: string | null;
  detailUrl: string;
};

type OrderCardProps = {
  order: OrderItem;
  index: number;
};

const easing = [0.23, 1, 0.32, 1] as const;

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export function OrderCard({
  order,
  index
}: OrderCardProps) {
  const isBaru = order.status === 'baru' || order.status === 'Menunggu Konfirmasi';
  const isDikirim = order.status === 'dikirim' || order.status === 'Diproses';

  const pill = isBaru
    ? 'bg-gradient-to-r from-warn-50 to-warn-100 text-warn-700'
    : isDikirim
      ? 'bg-gradient-to-r from-brand-50 to-brand-200 text-brand-700'
      : 'bg-gradient-to-r from-positive-50 to-brand-100 text-positive-600';

  const StatusIcon = isBaru ? ClockIcon : isDikirim ? PackageIcon : TruckIcon;

  const displayStatus = isBaru
    ? 'Menunggu Konfirmasi'
    : isDikirim
      ? 'Diproses'
      : 'Siap Kirim / Selesai';

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: easing, delay: Math.min(index, 5) * 0.04 }}
      className="list-none overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-white to-brand-100 shadow-card"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Order ID
            </p>
            <p className="text-sm font-extrabold text-brand-600">{order.id}</p>
            <h3 className="mt-1 truncate text-lg font-extrabold leading-snug text-brand-900">
              {order.customer}
            </h3>
          </div>
          <span className={['flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', pill].join(' ')}>
            <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {displayStatus}
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          {order.image ? (
            <img src={order.image} alt={order.productName} className="h-20 w-20 shrink-0 rounded-2xl border border-white/70 bg-white object-cover shadow-card" />
          ) : (
            <span aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-brand-100 to-brand-300 shadow-card">
              <ShoppingBasketIcon className="h-8 w-8 text-brand-700" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Produk
            </p>
            <p className="text-sm font-bold leading-snug text-brand-900">{order.productName}</p>
            {order.productNote && <p className="text-[11px] font-medium text-slate-500">{order.productNote}</p>}
            <p className="mt-1.5 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
              {order.quantity}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-brand-100 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Total Pembayaran
            </p>
            <p className="text-xl font-extrabold tracking-tight text-brand-900">
              {currency.format(order.total)}
            </p>
          </div>
          <p className="text-[11px] font-medium text-slate-500">{order.placedAt}</p>
        </div>
      </div>

      <Link
        href={order.detailUrl}
        className="group flex w-full items-center justify-between border-t border-brand-100 bg-gradient-to-r from-brand-50 to-brand-100 px-4 py-3 text-sm font-bold text-brand-700 transition-colors duration-150 ease-out hover:to-brand-200 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-700"
      >
        Lihat Detail
        <ChevronRightIcon className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </motion.li>
  );
}
