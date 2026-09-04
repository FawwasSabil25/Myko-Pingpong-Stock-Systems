"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClockIcon, TruckIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";
import { OrderCard, type OrderItem } from "@/components/OrderCard";

interface OrderData {
  id_pesanan: string;
  tanggal_input: string;
  status: string;
  platform: string;
  nama_pelanggan: string;
  metode_pengiriman: string;
  no_pesanan?: string | null;
  detail_pesanan: {
    jumlah: number;
    varian: {
      nama_varian: string;
      produk: {
        nama_produk: string;
        harga?: number | null;
        foto_url?: string | null;
      };
    };
  }[];
}

const easing = [0.23, 1, 0.32, 1] as const;

export default function DaftarPesananPengelolaPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pesanan")
      .select(`
        id_pesanan,
        tanggal_input,
        status,
        platform,
        nama_pelanggan,
        metode_pengiriman,
        no_pesanan,
        detail_pesanan (
          jumlah,
          varian (
            nama_varian,
            produk (
              nama_produk,
              harga,
              foto_url
            )
          )
        )
      `)
      .order("tanggal_input", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders((data as any[]) || []);
    }
    setLoading(false);
  }

  const activeOrders = orders.filter((o) => o.status === "baru");
  const shippedOrders = orders.filter((o) => o.status === "dikirim" || o.status === "selesai");

  const formattedOrders: OrderItem[] = orders.map((o) => {
    const totalPrice = o.detail_pesanan.reduce((sum, d) => {
      const price = d.varian?.produk?.harga || 0;
      return sum + price * d.jumlah;
    }, 0);

    const firstDetail = o.detail_pesanan[0];
    const productName = firstDetail
      ? firstDetail.varian?.produk?.nama_produk || "Produk"
      : "Pesanan";
    const productNote = firstDetail
      ? `${firstDetail.varian?.nama_varian || ""} ${o.detail_pesanan.length > 1 ? `(+${o.detail_pesanan.length - 1} item lain)` : ""}`
      : "";
    const totalQty = o.detail_pesanan.reduce((sum, d) => sum + d.jumlah, 0);
    const image = firstDetail?.varian?.produk?.foto_url || null;

    return {
      id: o.no_pesanan || `#ORD-${o.id_pesanan.slice(0, 8).toUpperCase()}`,
      customer: o.nama_pelanggan || "(Tanpa Nama)",
      status: o.status,
      productName,
      productNote,
      quantity: `${totalQty} Item`,
      total: totalPrice,
      placedAt: new Date(o.tanggal_input).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      image,
      detailUrl: `/pengelola/pesanan/${o.id_pesanan}`,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <AppHeader storeName="Myko Pingpong" initial="E" />

      <main className="px-5 pb-24 pt-6 max-w-md mx-auto space-y-6">
        <section>
          <p className="text-sm font-semibold text-brand-600">Pengemasan &amp; Pengiriman</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-900">
            Daftar Pesanan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola pesanan yang perlu dikemas dan dikonfirmasi pengirimannya.
          </p>
        </section>

        {/* Ringkasan Pesanan Banner */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easing }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-800 to-brand-900 p-5 text-white shadow-lift"
          aria-label="Ringkasan pesanan aktif"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-b from-brand-400/40 to-transparent blur-2xl"
          />
          <div className="relative">
            <p className="text-sm font-semibold text-brand-200">Pesanan Perlu Diproses</p>
            <p className="mt-1 text-5xl font-extrabold leading-none tracking-tight">
              {activeOrders.length}
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white/10 px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-200">
                  <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Menunggu
                </dt>
                <dd className="mt-0.5 text-lg font-extrabold">{activeOrders.length}</dd>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-200">
                  <TruckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Dikirim
                </dt>
                <dd className="mt-0.5 text-lg font-extrabold">{shippedOrders.length}</dd>
              </div>
            </dl>
          </div>
        </motion.section>

        {/* List of Orders */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : formattedOrders.length > 0 ? (
          <ul className="space-y-4">
            {formattedOrders.map((order, index) => (
              <OrderCard key={order.id} order={order} index={index} />
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-8 text-center shadow-card">
            <p className="text-base font-extrabold text-brand-900">Tidak ada pesanan</p>
            <p className="mt-1 text-sm text-slate-600">
              Belum ada pesanan yang tercatat di sistem.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
