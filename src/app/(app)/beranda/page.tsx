"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getRole, getWhatsApp, clearAll, type Role } from "@/lib/role";

interface VarianSummary {
  id_varian: string;
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
  produk: {
    nama_produk: string;
    harga?: number | null;
  };
}

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

interface DailyOutgoingData {
  label: string;
  dateStr: string;
  amount: number;
}

export default function BerandaPage() {
  const router = useRouter();
  const [role, setRoleState] = useState<Role | null>(null);
  const [wa, setWa] = useState<string | null>(null);

  // Owner summary states
  const [lowStockCount, setLowStockCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [dailyOutgoing, setDailyOutgoing] = useState<DailyOutgoingData[]>([]);
  const [totalOutgoingCount, setTotalOutgoingCount] = useState(0);

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
    setWa(getWhatsApp());
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

        // 3. Fetch outgoing stock for the last 7 days (Pergerakan Stok 7 Hari)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // include today
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data: histData, error: histError } = await supabase
          .from("histori_stok")
          .select("jumlah, tanggal")
          .eq("jenis", "keluar")
          .gte("tanggal", sevenDaysAgo.toISOString());

        if (histError) throw histError;

        const parsedHist = histData || [];
        const daysOfWeek = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
        const last7Days: DailyOutgoingData[] = [];

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayName = daysOfWeek[d.getDay()];
          const dateStr = d.toISOString().split("T")[0];
          last7Days.push({ label: dayName, dateStr, amount: 0 });
        }

        parsedHist.forEach((h: any) => {
          const hDate = h.tanggal.split("T")[0];
          const match = last7Days.find((day) => day.dateStr === hDate);
          if (match) {
            match.amount += h.jumlah;
          }
        });

        const totalOutgoing = last7Days.reduce((sum, d) => sum + d.amount, 0);
        setDailyOutgoing(last7Days);
        setTotalOutgoingCount(totalOutgoing);

      } else if (userRole === "pengelola") {
        // 1. Fetch active orders for Pengelola list
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

  function handleReset() {
    clearAll();
    router.replace("/setup");
  }

  // Find max amount in daily outgoing to scale chart bars
  const maxOutgoingVal = dailyOutgoing.length > 0 
    ? Math.max(...dailyOutgoing.map(d => d.amount)) 
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* TopAppBar - Figma Style */}
      <header
        className="flex items-center justify-between px-6 bg-white border-b border-[#F1F5F9] shrink-0"
        style={{
          height: "64px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar Circle */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: "#007F9D" }}
          >
            {role === "pemilik" ? "W" : "E"}
          </div>
          <span
            className="text-lg font-bold"
            style={{ color: "#0891B2", fontFamily: "Inter" }}
          >
            Myko Pingpong
          </span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
          title="Logout / Ganti Peran"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-10 max-w-lg mx-auto w-full pb-[100px]">
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-[#6E797E] font-medium">Memuat ringkasan...</p>
          </div>
        ) : role === "pemilik" ? (
          /* ================= OWNER DASHBOARD VIEW ================= */
          <div className="flex flex-col gap-10">
            {/* Section - Welcome & High-level Stats */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h1
                  className="text-[30px] font-bold leading-[38px]"
                  style={{ color: "#191C1E", fontFamily: "Inter" }}
                >
                  Halo, Wylyem
                </h1>
                <p className="text-base leading-6" style={{ color: "#3E484D", fontFamily: "Inter" }}>
                  Berikut ringkasan performa hari ini.
                </p>
              </div>

              {/* Stats highlights (2 column grid) */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* Stok Menipis Card */}
                <Link
                  href="/produk"
                  className="p-4 rounded-xl border flex flex-col justify-between transition-shadow hover:shadow-md"
                  style={{
                    height: "90px",
                    backgroundColor: "#FFDAD6",
                    borderColor: "rgba(186, 26, 26, 0.2)",
                  }}
                >
                  <span
                    className="text-sm font-semibold leading-5"
                    style={{ color: "#93000A", fontFamily: "Inter" }}
                  >
                    Stok Menipis
                  </span>
                  <span
                    className="text-2xl font-semibold leading-8"
                    style={{ color: "#BA1A1A", fontFamily: "Inter" }}
                  >
                    {lowStockCount} Item
                  </span>
                </Link>

                {/* Pesanan Aktif Card */}
                <Link
                  href="/pemilik/pesanan"
                  className="p-4 rounded-xl border bg-white flex flex-col justify-between transition-shadow hover:shadow-md"
                  style={{
                    height: "90px",
                    borderColor: "rgba(189, 200, 206, 0.3)",
                  }}
                >
                  <span
                    className="text-sm font-semibold leading-5"
                    style={{ color: "#3E484D", fontFamily: "Inter" }}
                  >
                    Pesanan Aktif
                  </span>
                  <span
                    className="text-2xl font-semibold leading-8"
                    style={{ color: "#00647C", fontFamily: "Inter" }}
                  >
                    {activeOrdersCount} Pesanan
                  </span>
                </Link>
              </div>

              {/* Input Pesanan Action Button - Figma Style (width 342px, height 68px, fontSize 24px) */}
              <Link
                href="/pemilik/pesanan/baru"
                className="w-full flex items-center justify-center gap-3 bg-[#00647C] text-white rounded-xl transition-opacity hover:opacity-90 active:scale-98"
                style={{
                  height: "68px",
                  boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                <span className="text-xl font-semibold" style={{ fontFamily: "Inter" }}>
                  Input Pesanan
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
              </Link>
            </div>

            {/* Section - Mini Chart: Pergerakan Stok */}
            <div className="flex flex-col gap-3">
              <h2
                className="text-2xl font-semibold leading-8"
                style={{ color: "#191C1E", fontFamily: "Inter" }}
              >
                Pergerakan Stok (7 Hari)
              </h2>

              <div
                className="bg-white border rounded-xl p-[17px] flex flex-col gap-4"
                style={{
                  height: "200px",
                  borderColor: "rgba(189, 200, 206, 0.3)",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#3E484D]">
                    Total Barang Keluar
                  </span>
                  <span className="text-2xl font-semibold text-[#191C1E] tabular-nums">
                    {totalOutgoingCount}
                  </span>
                </div>

                {/* CSS Flex Bar Chart */}
                <div className="flex-1 flex items-end justify-between gap-1 pt-1 h-[95px]">
                  {dailyOutgoing.map((day, idx) => {
                    // Calculate height percentage relative to max amount
                    const barHeightPct = maxOutgoingVal > 0 
                      ? (day.amount / maxOutgoingVal) * 100 
                      : 0;
                    
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                      >
                        {/* Bar column */}
                        <div
                          className="w-full rounded-t-sm transition-all duration-500"
                          style={{
                            height: `${Math.max(8, barHeightPct)}%`,
                            backgroundColor: day.amount > 0 ? "#00647C" : "rgba(0, 100, 124, 0.15)",
                          }}
                          title={`${day.amount} pcs`}
                        />
                        {/* Label */}
                        <span className="text-[10px] text-[#3E484D] font-medium leading-[15px]">
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rekap Hub Navigation Button */}
            <div
              className="bg-white rounded-2xl p-5 border border-[#E2E8F0] flex items-center justify-between"
              style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}
            >
              <div className="flex flex-col gap-1 pr-2">
                <h3 className="text-sm font-bold text-[#191C1E]">
                  Ringkasan & Analitik Rekap
                </h3>
                <p className="text-xs text-[#6E797E] leading-4">
                  Analisis rekap performa penjualan dan pergerakan persediaan stok.
                </p>
              </div>
              <Link
                href="/pemilik/rekap"
                className="h-10 px-4 bg-[#00647C] hover:opacity-90 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0 transition-opacity"
              >
                Buka Rekap
              </Link>
            </div>
          </div>
        ) : (
          /* ================= PENGELOLA DASHBOARD VIEW ================= */
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1
                className="text-[30px] font-bold leading-[38px]"
                style={{ color: "#191C1E", fontFamily: "Inter" }}
              >
                Pesanan Hari Ini
              </h1>
              <p className="text-base leading-6" style={{ color: "#3E484D", fontFamily: "Inter" }}>
                Halo Erwina, berikut adalah daftar pesanan yang perlu segera diproses.
              </p>
            </div>

            {activeOrders.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3"
                style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}
              >
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                  <span className="text-lg">🎉</span>
                </div>
                <h4 className="text-sm font-bold text-[#191C1E]">Semua Pesanan Dikirim!</h4>
                <p className="text-xs text-[#6E797E]">
                  Tidak ada pesanan aktif baru yang menunggu pengemasan.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {activeOrders.map((order) => {
                  // Calculate order total price
                  const totalPrice = order.detail_pesanan.reduce((sum, d) => {
                    const price = d.varian.produk.harga || 0;
                    return sum + (price * d.jumlah);
                  }, 0);

                  const firstItem = order.detail_pesanan[0];
                  const firstItemText = firstItem 
                    ? `${firstItem.varian.produk.nama_produk}` 
                    : "-";
                  const firstVarianText = firstItem 
                    ? `${firstItem.varian.nama_varian} | Jumlah: ${firstItem.jumlah} Unit` 
                    : "";

                  return (
                    <div
                      key={order.id_pesanan}
                      className="bg-white rounded-2xl border border-[#BDC8CE] overflow-hidden flex flex-col"
                      style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)" }}
                    >
                      {/* Card Body */}
                      <div className="p-6 flex flex-col gap-4">
                        {/* Title and Badge Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs text-[#6E797E]">Order ID:</span>
                            <span className="text-base font-bold text-[#00647C] leading-5">
                              {order.no_pesanan || `#ORD-${order.id_pesanan.slice(0, 8).toUpperCase()}`}
                            </span>
                            <h3 className="text-lg font-semibold text-[#191C1E] mt-1.5 leading-6">
                              {order.nama_pelanggan}
                            </h3>
                          </div>
                          {/* Baru Badge */}
                          <span
                            className="text-xs font-bold px-4 py-1.5 rounded-full"
                            style={{
                              backgroundColor: "#FFDAD6",
                              color: "#93000A",
                            }}
                          >
                            Baru
                          </span>
                        </div>

                        {/* Order Item Details inside a Grey Box */}
                        <div className="bg-[#ECEEF0] rounded-lg p-4 flex flex-col gap-3">
                          <div>
                            <span className="text-xs font-semibold text-[#3E484D]">
                              Produk
                            </span>
                            <p className="text-sm font-medium text-[#191C1E] mt-0.5">
                              {firstItemText}
                            </p>
                            <p className="text-xs text-[#3E484D] mt-0.5">
                              {firstVarianText}
                            </p>
                            {order.detail_pesanan.length > 1 && (
                              <p className="text-xs font-semibold text-[#00647C] mt-1">
                                + {order.detail_pesanan.length - 1} item lainnya
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-[#D1D5DB] flex flex-col">
                            <span className="text-xs font-semibold text-[#3E484D]">
                              Total Pembayaran
                            </span>
                            <span className="text-base font-bold text-[#191C1E] mt-0.5">
                              {totalPrice > 0 ? `Rp ${totalPrice.toLocaleString("id-ID")}` : "Rp -"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer Bar */}
                      <div
                        className="bg-[#F2F4F6] border-t border-[#BDC8CE] px-6 py-4 flex items-center justify-between gap-3 shrink-0"
                        style={{ height: "76px" }}
                      >
                        <Link
                          href={`/pengelola/pesanan/${order.id_pesanan}`}
                          className="flex-1 max-w-[125px] h-11 border border-[#00647C] text-[#00647C] rounded-lg flex items-center justify-center text-xs font-semibold hover:bg-[#00647C]/5 transition-colors"
                        >
                          Lihat Detail
                        </Link>
                        <Link
                          href={`/pengelola/pesanan/${order.id_pesanan}`}
                          className="flex-1 max-w-[155px] h-11 bg-[#00647C] text-white rounded-lg flex items-center justify-center text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          Proses Pesanan
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
