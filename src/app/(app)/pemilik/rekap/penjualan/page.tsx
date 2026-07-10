"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRole } from "@/lib/role";

interface PenjualanTx {
  id_histori: string;
  tanggal: string;
  nama_produk: string;
  nama_varian: string;
  jumlah: number;
  harga_satuan: number;
  total_pendapatan: number;
}

export default function RekapPenjualanPage() {
  const router = useRouter();
  const [penjualanList, setPenjualanList] = useState<PenjualanTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [periode, setPeriode] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }
  }, [router]);

  useEffect(() => {
    fetchPenjualan();
  }, [periode, startDate, endDate]);

  async function fetchPenjualan() {
    try {
      setLoading(true);
      setError(null);

      if (periode === "custom" && (!startDate || !endDate)) {
        setPenjualanList([]);
        setLoading(false);
        return;
      }

      let url = `/api/rekap/penjualan?periode=${periode}&`;
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

  function formatTanggal(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const grandTotalUnits = penjualanList.reduce((sum, item) => sum + item.jumlah, 0);
  const grandTotalRevenue = penjualanList.reduce((sum, item) => sum + item.total_pendapatan, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-6 bg-white border-b border-[#F1F5F9] shrink-0"
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
        <h1 className="text-lg font-bold leading-6" style={{ color: "#00647C" }}>
          Rekap Penjualan
        </h1>
      </header>

      {/* Main Container */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-[100px]">
        {/* Filters Card */}
        <div
          className="bg-white rounded-xl p-4 flex flex-col gap-4 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <span className="text-xs font-bold text-[#191C1E] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            Periode Penjualan
          </span>

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
        </div>

        {/* Aggregate summary cards */}
        {!loading && penjualanList.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-[#6E797E] uppercase">Total Terjual</span>
              <span className="text-lg font-black text-[#191C1E]">{grandTotalUnits} unit</span>
            </div>
            <div className="bg-[#ECFDF5] rounded-xl p-4 border border-[#A7F3D0] shadow-sm flex flex-col gap-1">
              <span className="text-[10px] font-semibold text-[#065F46] uppercase">Total Pendapatan</span>
              <span className="text-lg font-black text-[#047857]">Rp {grandTotalRevenue.toLocaleString("id-ID")}</span>
            </div>
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

        {/* Sales Table */}
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
          <div
            className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
            style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.02)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="px-4 py-3 text-[10px] font-bold text-[#6E797E] uppercase tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-[#6E797E] uppercase tracking-wider">Produk</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-[#6E797E] uppercase tracking-wider text-center">Qty</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-[#6E797E] uppercase tracking-wider text-right">Total (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {penjualanList.map((tx) => (
                    <tr key={tx.id_histori} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5 text-[#6E797E] whitespace-nowrap">
                        {formatTanggal(tx.tanggal)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#191C1E]">
                        <div className="font-semibold text-slate-800 line-clamp-1">{tx.nama_produk}</div>
                        <div className="text-[10px] text-slate-400">Varian: {tx.nama_varian}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-[#191C1E]">
                        {tx.jumlah}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#00647C] whitespace-nowrap">
                        {tx.total_pendapatan.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
