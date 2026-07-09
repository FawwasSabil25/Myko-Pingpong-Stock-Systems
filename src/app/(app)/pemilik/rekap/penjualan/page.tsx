"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRole } from "@/lib/role";

interface PenjualanAgg {
  id_varian: string;
  nama_produk: string;
  nama_varian: string;
  total_terjual: number;
}

export default function RekapPenjualanPage() {
  const router = useRouter();
  const [penjualanList, setPenjualanList] = useState<PenjualanAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort states
  const [periode, setPeriode] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("terjual");

  useEffect(() => {
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }
  }, [router]);

  useEffect(() => {
    fetchPenjualan();
  }, [periode, startDate, endDate, sort]);

  async function fetchPenjualan() {
    try {
      setLoading(true);
      setError(null);

      // Pastikan custom dates sudah diisi jika periode = custom
      if (periode === "custom" && (!startDate || !endDate)) {
        setPenjualanList([]);
        setLoading(false);
        return;
      }

      let url = `/api/rekap/penjualan?periode=${periode}&sort=${sort}&`;
      if (periode === "custom") {
        url += `startDate=${new Date(startDate).toISOString()}&`;
        url += `endDate=${new Date(endDate).toISOString()}&`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal mengambil rekap penjualan.");
      }
      const data = await res.json();
      setPenjualanList(data || []);
    } catch (err: any) {
      console.error("Error fetching penjualan rekap:", err);
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  // Sum total units sold in filtered period
  const grandTotal = penjualanList.reduce((sum, item) => sum + item.total_terjual, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-6 bg-white border-b border-[#F1F5F9]"
        style={{
          height: "64px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Link
          href="/pemilik/rekap"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00647C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1
          className="text-lg font-bold leading-6"
          style={{ color: "#00647C" }}
        >
          Rekap Penjualan
        </h1>
      </header>

      {/* Main Container */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-[86px]">
        {/* Filters and Sorts */}
        <div
          className="bg-white rounded-xl p-4 flex flex-col gap-4 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <span className="text-xs font-bold text-[#191C1E] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            Periode & Urutan
          </span>

          {/* Period Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#6E797E] uppercase">
              Pilih Periode
            </label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="w-full h-10 px-3 border border-[#BDC8CE] rounded bg-white text-xs focus:outline-none focus:border-[#00647C]"
            >
              <option value="today">Hari Ini</option>
              <option value="week">Pekan Ini (7 Hari Terakhir)</option>
              <option value="month">Bulan Ini (30 Hari Terakhir)</option>
              <option value="custom">Rentang Kustom</option>
            </select>
          </div>

          {/* Custom Date Range Selectors */}
          {periode === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#6E797E] uppercase">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 border border-[#BDC8CE] rounded bg-white text-xs focus:outline-none focus:border-[#00647C]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#6E797E] uppercase">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 border border-[#BDC8CE] rounded bg-white text-xs focus:outline-none focus:border-[#00647C]"
                />
              </div>
            </div>
          )}

          {/* Sort Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#6E797E] uppercase">
              Urutkan Berdasarkan
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full h-10 px-3 border border-[#BDC8CE] rounded bg-white text-xs focus:outline-none focus:border-[#00647C]"
            >
              <option value="terjual">Paling Banyak Terjual</option>
              <option value="produk">Nama Produk (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Grand Total Indicator */}
        {!loading && (
          <div
            className="bg-white rounded-xl p-4 flex items-center justify-between border border-[#E2E8F0] shadow-sm"
          >
            <span className="text-sm font-semibold text-[#6E797E]">Total Unit Terjual:</span>
            <span className="text-lg font-black text-[#00647C]">
              {grandTotal} pcs
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg
              className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Sales Table / List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : periode === "custom" && (!startDate || !endDate) ? (
          <p className="text-sm text-[#6E797E] text-center py-10">
            Harap isi kedua filter tanggal di atas untuk melihat rekap kustom.
          </p>
        ) : penjualanList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-[#6E797E] text-center">
              Tidak ada data penjualan dalam periode terpilih.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {penjualanList.map((item, index) => {
              // Highlight item dengan penjualan terbanyak (hanya jika diurut berdasarkan terjual, index 0 adalah top seller)
              const isTopSeller = sort === "terjual" && index === 0 && item.total_terjual > 0;

              return (
                <div
                  key={item.id_varian}
                  className={`bg-white rounded-xl p-4 flex items-center justify-between border transition-all ${
                    isTopSeller ? "border-[#0891B2] bg-cyan-50/10" : "border-[#E2E8F0]"
                  }`}
                  style={{ boxShadow: "0px 2px 8px rgba(0,0,0,0.01)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isTopSeller && (
                      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                        <span className="text-base">👑</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-semibold text-[#191C1E] truncate">
                        {item.nama_produk}
                      </h3>
                      <p className="text-xs text-[#6E797E] truncate">
                        Varian: {item.nama_varian}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="text-sm font-black text-[#191C1E]">
                      {item.total_terjual} pcs
                    </span>
                    {isTopSeller && (
                      <span className="text-[10px] font-bold text-cyan-600 mt-0.5">
                        Produk Terlaris
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
