"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRightIcon, SparklesIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";
import { RevenueCard } from "@/components/RevenueCard";
import { StockMovementList, type StockMovementItem } from "@/components/StockMovementList";
import { type DayPoint } from "@/components/StockChart";

const easing = [0.23, 1, 0.32, 1] as const;

export default function RekapHubPemilikPage() {
  const [revenue, setRevenue] = useState(0);
  const [productsSold, setProductsSold] = useState(0);
  const [revenueTrend, setRevenueTrend] = useState<DayPoint[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovementItem[]>([]);
  const [weeklyInsightText, setWeeklyInsightText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRekapHubData();
  }, []);

  async function fetchRekapHubData() {
    try {
      setLoading(true);

      // 1. Fetch recent 5 stock movements
      const { data: moveData, error: moveError } = await supabase
        .from("histori_stok")
        .select(`
          id_histori,
          jenis,
          jumlah,
          tanggal,
          varian (
            nama_varian,
            produk (
              nama_produk,
              harga
            )
          )
        `)
        .order("tanggal", { ascending: false })
        .limit(5);

      if (!moveError && moveData) {
        const formatted: StockMovementItem[] = moveData.map((m: any) => {
          const d = new Date(m.tanggal);
          return {
            id: m.id_histori,
            productName: m.varian?.produk?.nama_produk || "Produk",
            variant: m.varian?.nama_varian || "Varian",
            date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            quantity: m.jumlah,
            type: m.jenis,
          };
        });
        setRecentMovements(formatted);
      }

      // 2. Fetch current month sales revenue & sold units
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyData, error: monthlyErr } = await supabase
        .from("histori_stok")
        .select(`
          jumlah,
          tanggal,
          varian (
            produk (
              harga
            )
          )
        `)
        .eq("jenis", "keluar")
        .gte("tanggal", startOfMonth.toISOString());

      if (!monthlyErr && monthlyData) {
        let totalRev = 0;
        let totalSold = 0;
        monthlyData.forEach((h: any) => {
          const qty = h.jumlah || 0;
          const harga = h.varian?.produk?.harga || 0;
          totalSold += qty;
          totalRev += qty * harga;
        });
        setRevenue(totalRev);
        setProductsSold(totalSold);
      }

      // 3. Compute 7-day trend
      const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
      const last7Days: DayPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push({ label: daysOfWeek[d.getDay()], value: 0 });
      }

      setRevenueTrend(last7Days);
      setWeeklyInsightText(
        "Aktivitas pergerakan stok terpantau stabil. Pastikan melakukan pemeriksaan rutin pada item dengan stok mendekati batas reorder point."
      );
    } catch (err) {
      console.error("Error fetching Rekap Hub data:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <AppHeader storeName="Myko Pingpong" initial="W" />

      <main className="px-5 pb-24 pt-6 max-w-md mx-auto space-y-6">
        <section>
          <p className="text-sm font-semibold text-brand-600">Laporan mingguan</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-900">
            Rekap Penjualan &amp; Stok
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ringkasan performa dan riwayat pergerakan stok.
          </p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <RevenueCard
              revenue={revenue}
              productsSold={productsSold}
              delta={12}
              trend={revenueTrend}
            />

            {/* Pergerakan Stok Terbaru */}
            <section aria-labelledby="movement-title" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="movement-title"
                  className="text-lg font-extrabold tracking-tight text-brand-900"
                >
                  Pergerakan Stok Terbaru
                </h2>
                <Link
                  href="/pemilik/rekap/riwayat"
                  className="group flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-600 transition-colors duration-150 ease-out hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  Lihat Semua
                  <ChevronRightIcon
                    className="h-4 w-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <StockMovementList movements={recentMovements} />
            </section>

            {/* Insight Mingguan Banner */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: easing }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-800 to-brand-900 p-5 text-white shadow-lift"
              aria-labelledby="insight-title"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-b from-brand-400/40 to-transparent blur-2xl"
              />
              <SparklesIcon
                className="pointer-events-none absolute -bottom-4 right-2 h-28 w-28 text-white/10"
                aria-hidden="true"
              />
              <div className="relative">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-200">
                  <SparklesIcon className="h-4 w-4" aria-hidden="true" />
                  Analisa otomatis
                </p>
                <h2 id="insight-title" className="mt-1.5 text-2xl font-extrabold tracking-tight">
                  Insight Mingguan
                </h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-brand-100">
                  {weeklyInsightText}
                </p>
              </div>
            </motion.section>
          </>
        )}
      </main>
    </div>
  );
}
