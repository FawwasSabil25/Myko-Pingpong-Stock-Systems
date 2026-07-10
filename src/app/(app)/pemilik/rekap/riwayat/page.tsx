"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getRole } from "@/lib/role";

interface Varian {
  id_varian: string;
  nama_varian: string;
  produk: {
    id_produk: string;
    nama_produk: string;
  };
}

interface HistoriStok {
  id_histori: string;
  jenis: "masuk" | "keluar";
  jumlah: number;
  tanggal: string;
  id_referensi: string | null;
  varian: Varian;
}

interface ProdukOption {
  id_produk: string;
  nama_produk: string;
}

export default function RekapRiwayatPage() {
  const router = useRouter();
  const [riwayatList, setRiwayatList] = useState<HistoriStok[]>([]);
  const [produkList, setProdukList] = useState<ProdukOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }
    fetchProducts();
  }, [router]);

  useEffect(() => {
    fetchRiwayat();
  }, [selectedProductId, startDate, endDate]);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("produk")
        .select("id_produk, nama_produk")
        .order("nama_produk", { ascending: true });

      if (error) throw error;
      setProdukList(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }

  async function fetchRiwayat() {
    try {
      setLoading(true);
      setError(null);

      let url = "/api/rekap/riwayat?";
      if (selectedProductId) {
        url += `id_produk=${selectedProductId}&`;
      }
      if (startDate) {
        url += `startDate=${new Date(startDate).toISOString()}&`;
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        url += `endDate=${d.toISOString()}&`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Gagal memuat data pergerakan stok.");
      }
      const data = await res.json();
      setRiwayatList(data || []);
    } catch (err: any) {
      console.error("Error loading riwayat:", err);
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

  function handleResetFilters() {
    setSelectedProductId("");
    setStartDate("");
    setEndDate("");
  }

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
          Riwayat Pergerakan Stok
        </h1>
      </header>

      {/* Main Container */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-[100px]">
        {/* Filters Card */}
        <div
          className="bg-white rounded-xl p-4 flex flex-col gap-4 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
            <span className="text-xs font-bold text-[#191C1E] uppercase tracking-wider">
              Filter Riwayat
            </span>
            {(selectedProductId || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Product Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#6E797E] uppercase">
              Filter Produk
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-10 px-3 border border-[#BDC8CE] rounded bg-white text-xs focus:outline-none focus:border-[#00647C]"
            >
              <option value="">Semua Produk</option>
              {produkList.map((p) => (
                <option key={p.id_produk} value={p.id_produk}>
                  {p.nama_produk}
                </option>
              ))}
            </select>
          </div>

          {/* Date range selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#6E797E] uppercase">
                Mulai Tanggal
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
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 border border-[#BDC8CE] rounded bg-white text-xs focus:outline-none focus:border-[#00647C]"
              />
            </div>
          </div>
        </div>

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

        {/* Riwayat Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : riwayatList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-sm text-[#6E797E] text-center">
              Tidak ada data pergerakan stok untuk filter terpilih.
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
                    <th className="px-4 py-3 text-[10px] font-bold text-[#6E797E] uppercase tracking-wider">Tipe</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-[#6E797E] uppercase tracking-wider">Barang (Varian)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-[#6E797E] uppercase tracking-wider text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs">
                  {riwayatList.map((item) => {
                    const isMasuk = item.jenis === "masuk";
                    return (
                      <tr key={item.id_histori} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 text-[#6E797E] whitespace-nowrap">
                          {formatTanggal(item.tanggal)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              isMasuk
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {isMasuk ? "Masuk" : "Keluar"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#191C1E]">
                          <div className="font-semibold text-slate-800 line-clamp-1">
                            {item.varian.produk.nama_produk}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Varian: {item.varian.nama_varian} | Ref: {item.id_referensi ? item.id_referensi.slice(0, 8) : "Manual"}
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3.5 text-center font-bold text-sm whitespace-nowrap ${
                            isMasuk ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {isMasuk ? `+${item.jumlah}` : `-${item.jumlah}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
