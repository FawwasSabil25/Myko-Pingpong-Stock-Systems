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
  };
}

interface OrderSummary {
  id_pesanan: string;
  tanggal_input: string;
  status: string;
  platform: string;
  nama_pelanggan: string;
  metode_pengiriman: string;
  detail_pesanan: {
    jumlah: number;
    varian: {
      nama_varian: string;
      produk: {
        nama_produk: string;
      };
    };
  }[];
}

export default function BerandaPage() {
  const router = useRouter();
  const [role, setRoleState] = useState<Role | null>(null);
  const [wa, setWa] = useState<string | null>(null);

  // Owner summary states
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<VarianSummary[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

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
        // 1. Fetch low stock items (jumlah_stok <= reorder_point)
        const { data: variants, error: varError } = await supabase
          .from("varian")
          .select(`
            id_varian,
            nama_varian,
            jumlah_stok,
            reorder_point,
            produk (
              nama_produk
            )
          `);

        if (varError) throw varError;

        const typedVariants = (variants as any[]) || [];
        const lowStock = typedVariants.filter(
          (v) => v.jumlah_stok <= v.reorder_point
        );

        setLowStockCount(lowStock.length);
        setLowStockItems(lowStock.slice(0, 3)); // show top 3 in summary

        // 2. Fetch count of active orders (status = 'baru')
        const { count, error: orderError } = await supabase
          .from("pesanan")
          .select("*", { count: "exact", head: true })
          .eq("status", "baru");

        if (orderError) throw orderError;
        setActiveOrdersCount(count || 0);
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
            detail_pesanan (
              jumlah,
              varian (
                nama_varian,
                produk (
                  nama_produk
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

  function formatTanggal(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = role === "pemilik" ? "Pemilik" : "Pengelola";
  const greeting = role === "pemilik" ? "Wylyem" : "Erwina";

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 bg-white border-b border-[#F1F5F9] shrink-0"
        style={{
          height: "64px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h1
          className="text-lg font-bold leading-6"
          style={{ color: "#00647C" }}
        >
          Myko Pingpong Stock
        </h1>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full uppercase"
          style={{
            backgroundColor: "#E0F2FE",
            color: "#0369A1",
          }}
        >
          {roleLabel}
        </span>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-[100px]">
        {/* Welcome Card */}
        <div
          className="bg-white rounded-2xl p-5 flex items-center justify-between border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-black"
              style={{ backgroundColor: "#00647C" }}
            >
              {greeting[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#191C1E] leading-5">
                Halo, {greeting}! 👋
              </h2>
              <p className="text-xs text-[#6E797E] mt-0.5">
                {role === "pemilik" ? "Pemilik Usaha Myko Pingpong" : "Pengelola Gudang & Pengemasan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
            title="Ganti Peran / Logout"
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
        </div>

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
          /* OWNER DASHBOARD VIEW */
          <div className="flex flex-col gap-6">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card A: Stok Menipis */}
              <Link
                href="/pemilik/produk"
                className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex flex-col gap-1 transition-shadow hover:shadow-md"
                style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
              >
                <span className="text-[10px] font-bold text-[#6E797E] uppercase tracking-wider">
                  Butuh Restok
                </span>
                <span className="text-3xl font-black text-red-500 mt-1">
                  {lowStockCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  Varian menipis
                </span>
              </Link>

              {/* Card B: Pesanan Aktif */}
              <Link
                href="/pemilik/pesanan"
                className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex flex-col gap-1 transition-shadow hover:shadow-md"
                style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
              >
                <span className="text-[10px] font-bold text-[#6E797E] uppercase tracking-wider">
                  Pesanan Aktif
                </span>
                <span className="text-3xl font-black text-[#00647C] mt-1">
                  {activeOrdersCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  Menunggu kirim
                </span>
              </Link>
            </div>

            {/* List Low Stock Items Preview */}
            {lowStockItems.length > 0 && (
              <div
                className="bg-white rounded-2xl p-5 border border-[#E2E8F0] flex flex-col gap-3"
                style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
              >
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                  <h3 className="text-xs font-bold text-[#191C1E] uppercase tracking-wider">
                    Peringatan Stok Menipis ⚠️
                  </h3>
                  <Link
                    href="/pemilik/produk"
                    className="text-xs font-bold text-[#00647C] hover:underline"
                  >
                    Semua
                  </Link>
                </div>
                <div className="flex flex-col gap-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id_varian}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-[#191C1E] truncate">
                          {item.produk.nama_produk}
                        </span>
                        <span className="text-[#6E797E] mt-0.5">
                          Varian: {item.nama_varian}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          Stok: {item.jumlah_stok} pcs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rekap Summary Link */}
            <div
              className="bg-white rounded-2xl p-5 border border-[#E2E8F0] flex items-center justify-between"
              style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
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
          /* PENGELOLA DASHBOARD VIEW (UC-09/10) */
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold text-[#6E797E] uppercase tracking-wider pl-1">
              Pesanan Aktif Perlu Dikemas ({activeOrders.length})
            </h3>

            {activeOrders.length === 0 ? (
              <div
                className="bg-white rounded-2xl p-8 border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3"
                style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
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
              <div className="flex flex-col gap-3">
                {activeOrders.map((order) => {
                  const qty = order.detail_pesanan.reduce((sum, d) => sum + d.jumlah, 0);
                  const firstItem = order.detail_pesanan[0];
                  const detailsLabel =
                    order.detail_pesanan.length > 1
                      ? `${firstItem.varian.produk.nama_produk} (${firstItem.varian.nama_varian}) + ${
                          order.detail_pesanan.length - 1
                        } item`
                      : `${firstItem?.varian.produk.nama_produk} (${firstItem?.varian.nama_varian})`;

                  return (
                    <Link
                      key={order.id_pesanan}
                      href={`/pengelola/pesanan/${order.id_pesanan}`}
                      className="bg-white rounded-xl p-4 border border-[#E2E8F0] hover:border-[#BDC8CE] flex flex-col gap-3 transition-all"
                      style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.01)" }}
                    >
                      <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold px-1.5 py-0.5 rounded bg-cyan-50 text-[#00647C]"
                          >
                            {order.platform}
                          </span>
                          <span className="text-[#6E797E] font-medium">
                            {formatTanggal(order.tanggal_input)}
                          </span>
                        </div>
                        <span className="font-extrabold text-[#00647C]">
                          {qty} pcs
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#6E797E]">Pelanggan</span>
                        <span className="text-sm font-extrabold text-[#191C1E]">
                          {order.nama_pelanggan}
                        </span>
                        <p className="text-xs text-[#6E797E] truncate mt-1">
                          Items: {detailsLabel}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#6E797E]">
                        <span>Kurir: <strong>{order.metode_pengiriman}</strong></span>
                        <span className="font-bold text-[#00647C] flex items-center gap-0.5">
                          Kemas Pesanan
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </span>
                      </div>
                    </Link>
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
