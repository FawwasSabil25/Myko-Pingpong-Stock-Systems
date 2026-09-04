"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScanBarcodeIcon, PackageSearchIcon } from "lucide-react";
import { supabase, getPengaturan } from "@/lib/supabase";
import { getRole, clearAll, type Role } from "@/lib/role";
import PullToRefresh from "@/components/PullToRefresh";
import { AppHeader } from "@/components/AppHeader";
import { StatCards } from "@/components/StatCards";
import { StockChart, type DayPoint } from "@/components/StockChart";
import { RevenueCard } from "@/components/RevenueCard";

interface OrderSummary {
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
      };
    };
  }[];
}

export default function BerandaPage() {
  const router = useRouter();
  const [role, setRoleState] = useState<Role | null>(null);

  // Owner summary states
  const [lowStockCount, setLowStockCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [stockMovement, setStockMovement] = useState<DayPoint[]>([]);
  const [totalOutgoingCount, setTotalOutgoingCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlySoldUnits, setMonthlySoldUnits] = useState(0);
  const [revenueTrend, setRevenueTrend] = useState<DayPoint[]>([]);
  const [revenueDelta, setRevenueDelta] = useState(0);

  // Pengelola order list state
  const [activeOrders, setActiveOrders] = useState<OrderSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const r = getRole();
    if (!r) {
      router.replace("/setup");
      return;
    }
    setRoleState(r);
    fetchDashboardData(r);
  }, [router]);

  async function fetchDashboardData(userRole: Role) {
    try {
      setLoading(true);
      setError(null);

      if (userRole === "pemilik") {
        // 1. Fetch low stock count (jumlah_stok <= reorder_point)
        const { data: variants, error: varError } = await supabase
          .from("varian")
          .select(`
            id_varian,
            jumlah_stok,
            reorder_point
          `);

        if (varError) throw varError;

        const typedVariants = (variants as any[]) || [];
        const lowStock = typedVariants.filter(
          (v) => v.jumlah_stok <= v.reorder_point
        );
        setLowStockCount(lowStock.length);

        // 2. Fetch count of active orders (status = 'baru')
        const { count, error: orderError } = await supabase
          .from("pesanan")
          .select("*", { count: "exact", head: true })
          .eq("status", "baru");

        if (orderError) throw orderError;
        setActiveOrdersCount(count || 0);

        // 3. Fetch outgoing stock for last 30 days and current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const queryDate = startOfMonth < thirtyDaysAgo ? startOfMonth : thirtyDaysAgo;

        const { data: histData, error: histError } = await supabase
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
          .gte("tanggal", queryDate.toISOString());

        if (histError) throw histError;

        const parsedHist = histData || [];

        // Compute monthly totals
        let tempMonthlyRevenue = 0;
        let tempMonthlySold = 0;

        // Compute 7-day bar chart
        const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const last7Days: { label: string; dateStr: string; value: number; revenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayName = daysOfWeek[d.getDay()];
          const dateStr = d.toISOString().split("T")[0];
          last7Days.push({ label: dayName, dateStr, value: 0, revenue: 0 });
        }

        parsedHist.forEach((h: any) => {
          const hDate = h.tanggal.split("T")[0];
          const qty = h.jumlah || 0;
          const harga = h.varian?.produk?.harga || 0;

          if (h.tanggal >= startOfMonth.toISOString()) {
            tempMonthlySold += qty;
            tempMonthlyRevenue += qty * harga;
          }

          const match7 = last7Days.find((day) => day.dateStr === hDate);
          if (match7) {
            match7.value += qty;
            match7.revenue += qty * harga;
          }
        });

        const totalOutgoing = last7Days.reduce((sum, d) => sum + d.value, 0);

        setStockMovement(last7Days.map((d) => ({ label: d.label, value: d.value })));
        setTotalOutgoingCount(totalOutgoing);
        setMonthlyRevenue(tempMonthlyRevenue);
        setMonthlySoldUnits(tempMonthlySold);
        setRevenueTrend(last7Days.map((d) => ({ label: d.label, value: d.revenue })));
        setRevenueDelta(12); // Sample growth percentage

      } else if (userRole === "pengelola") {
        // Fetch active orders for Pengelola list
        const { data: orders, error: orderError } = await supabase
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
                  harga
                )
              )
            )
          `)
          .eq("status", "baru")
          .order("tanggal_input", { ascending: false });

        if (orderError) throw orderError;
        setActiveOrders((orders as any[]) || []);
      }
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError("Gagal memuat ringkasan data.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAll();
    router.replace("/setup");
  }

  return (
    <PullToRefresh onRefresh={() => role ? fetchDashboardData(role) : Promise.resolve()}>
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
        <AppHeader storeName="Myko Pingpong" initial={role === "pemilik" ? "W" : "E"} onLogout={handleLogout} />

        <main className="px-5 pb-24 pt-6 max-w-md mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-alert-50 border border-alert-100 rounded-2xl text-sm font-semibold text-alert-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-brand-700">Memuat ringkasan performa...</p>
            </div>
          ) : role === "pemilik" ? (
            /* ================= OWNER DASHBOARD VIEW ================= */
            <div className="space-y-6">
              <section>
                <p className="text-sm font-semibold text-brand-600">Selamat datang kembali</p>
                <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-900">
                  Halo, Wylyem
                </h1>
                <p className="mt-1 text-sm text-slate-600">Berikut ringkasan performa hari ini.</p>
              </section>

              <StatCards
                lowStockCount={lowStockCount}
                activeOrders={activeOrdersCount}
              />

              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
              >
                <Link
                  href="/pemilik/pesanan/baru"
                  className="relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-brand-900 px-5 py-4 text-lg font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
                  />
                  <ScanBarcodeIcon className="relative h-6 w-6" strokeWidth={2.2} />
                  <span className="relative">Input Pesanan</span>
                </Link>
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-lg font-extrabold tracking-tight text-brand-900">
                  Pergerakan Stok &amp; Performa
                </h2>
                <StockChart data={stockMovement} total={totalOutgoingCount} />
                <RevenueCard
                  revenue={monthlyRevenue}
                  productsSold={monthlySoldUnits}
                  delta={revenueDelta}
                  trend={revenueTrend}
                />
              </div>

              {/* Quick Rekap Link */}
              <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-5 shadow-card flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-brand-900">
                    Ringkasan &amp; Analitik Rekap
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Analisis performa penjualan &amp; histori persediaan stok.
                  </p>
                </div>
                <Link
                  href="/pemilik/rekap"
                  className="shrink-0 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 px-4 py-2.5 text-xs font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95"
                >
                  Buka Rekap
                </Link>
              </div>
            </div>
          ) : (
            /* ================= PENGELOLA DASHBOARD VIEW ================= */
            <div className="space-y-6">
              <section>
                <p className="text-sm font-semibold text-brand-600">Selamat bekerja</p>
                <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-900">
                  Pesanan Hari Ini
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Halo Erwina, berikut daftar pesanan yang perlu diproses.
                </p>
              </section>

              {activeOrders.length === 0 ? (
                <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-8 text-center shadow-card">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-positive-50 text-positive-600">
                    🎉
                  </span>
                  <p className="mt-4 text-base font-extrabold text-brand-900">
                    Semua Pesanan Dikirim!
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Tidak ada pesanan aktif baru yang menunggu pengemasan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => {
                    const totalPrice = order.detail_pesanan.reduce((sum, d) => {
                      const price = d.varian.produk.harga || 0;
                      return sum + price * d.jumlah;
                    }, 0);

                    const firstItem = order.detail_pesanan[0];
                    const firstItemText = firstItem
                      ? `${firstItem.varian.produk.nama_produk}`
                      : "-";
                    const firstVarianText = firstItem
                      ? `${firstItem.varian.nama_varian} (x${firstItem.jumlah})`
                      : "";

                    return (
                      <div
                        key={order.id_pesanan}
                        className="rounded-3xl border border-white/70 bg-gradient-to-br from-white via-white to-brand-100 p-5 shadow-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                              Order ID: {order.no_pesanan || `#ORD-${order.id_pesanan.slice(0, 8).toUpperCase()}`}
                            </span>
                            <h3 className="mt-1 text-base font-extrabold text-brand-900">
                              {order.nama_pelanggan || "(Tanpa nama)"}
                            </h3>
                          </div>
                          <span className="rounded-full bg-gradient-to-r from-alert-50 to-alert-100 px-3 py-1 text-xs font-bold text-alert-700">
                            Baru
                          </span>
                        </div>

                        <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
                          <p className="text-xs font-bold text-brand-700">Produk:</p>
                          <p className="text-sm font-extrabold text-brand-900 mt-0.5">{firstItemText}</p>
                          <p className="text-xs font-medium text-slate-600 mt-0.5">{firstVarianText}</p>
                          {order.detail_pesanan.length > 1 && (
                            <p className="mt-1 text-xs font-bold text-brand-600">
                              + {order.detail_pesanan.length - 1} item lainnya
                            </p>
                          )}

                          <div className="mt-3 border-t border-brand-100 pt-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Total:</span>
                            <span className="text-sm font-extrabold text-brand-900">
                              Rp {totalPrice.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/pengelola/pesanan/${order.id_pesanan}`}
                          className="mt-4 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 py-3 text-sm font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95"
                        >
                          Proses Pesanan
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </PullToRefresh>
  );
}
