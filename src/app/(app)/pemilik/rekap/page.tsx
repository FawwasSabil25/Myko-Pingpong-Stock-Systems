"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRole } from "@/lib/role";

interface Varian {
  id_varian: string;
  nama_varian: string;
  produk: {
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

interface PenjualanTransaction {
  id_histori: string;
  tanggal: string;
  nama_produk: string;
  nama_varian: string;
  jumlah: number;
  harga_satuan: number;
  total_pendapatan: number;
}

export default function RekapHubPage() {
  const router = useRouter();
  const [riwayatList, setRiwayatList] = useState<HistoriStok[]>([]);
  const [penjualanList, setPenjualanList] = useState<PenjualanTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }
    fetchHubData();
  }, [router]);

  async function fetchHubData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch riwayat (limit 4 di client) dan rekap penjualan (periode month) secara paralel
      const [resRiwayat, resPenjualan] = await Promise.all([
        fetch("/api/rekap/riwayat"),
        fetch("/api/rekap/penjualan?periode=month"),
      ]);

      if (!resRiwayat.ok || !resPenjualan.ok) {
        throw new Error("Gagal mengambil data rekap.");
      }

      const dataRiwayat = await resRiwayat.json();
      const dataPenjualan = await resPenjualan.json();

      setRiwayatList(dataRiwayat || []);
      setPenjualanList(dataPenjualan || []);
    } catch (err: any) {
      console.error("Error loading hub data:", err);
      setError(err.message || "Gagal memuat data ringkasan rekap.");
    } finally {
      setLoading(false);
    }
  }

  // Sum total unit terjual in last 30 days
  const totalTerjual = penjualanList.reduce((sum, item) => sum + (item.jumlah || 0), 0);

  // Format tanggal singkat
  function formatTanggal(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  }

  // Preview 4 pergerakan stok terakhir
  const riwayatPreview = riwayatList.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header
        className="flex items-center px-6 bg-white border-b border-[#F1F5F9]"
        style={{
          height: "64px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h1
          className="text-lg font-bold leading-6"
          style={{ color: "#00647C" }}
        >
          Rekap Penjualan & Stok
        </h1>
      </header>

      {/* Main Container */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-[86px]">
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-[#6E797E] font-medium">Memuat rekap...</p>
          </div>
        ) : (
          <>
            {/* Sales Summary Card (UC-08 Hub) */}
            <div
              className="bg-white rounded-2xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md border border-[#E2E8F0]"
              style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#6E797E] uppercase tracking-wider">
                    Sales Summary (30 Hari Terakhir)
                  </span>
                  <span className="text-[34px] font-black leading-[44px] text-[#191C1E] mt-1">
                    {totalTerjual} <span className="text-base font-semibold text-[#6E797E]">pcs</span>
                  </span>
                  <span className="text-xs font-medium text-green-600 mt-1 flex items-center gap-1">
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
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    Tren unit penjualan stabil
                  </span>
                </div>

                {/* Styled Sparkline Trend Preview */}
                <div className="w-24 h-12">
                  <svg className="w-full h-full" viewBox="0 0 100 40">
                    <path
                      d="M0 35 Q15 15, 30 25 T60 10 T90 20 L100 5"
                      fill="none"
                      stroke="#0891B2"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 35 Q15 15, 30 25 T60 10 T90 20 L100 5 L100 40 L0 40 Z"
                      fill="url(#sparklineGrad)"
                      opacity="0.1"
                    />
                    <defs>
                      <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0891B2" />
                        <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              <Link
                href="/pemilik/rekap/penjualan"
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-bold text-[#00647C] bg-cyan-50/50 hover:bg-[#ecfeff] border border-[#00647C]/10 transition-colors cursor-pointer"
              >
                Lihat Detail Penjualan
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Stock Movement Card (UC-05 Hub) */}
            <div
              className="bg-white rounded-2xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-md border border-[#E2E8F0]"
              style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#6E797E] uppercase tracking-wider">
                  Stock Movement (Aktivitas Terakhir)
                </span>
              </div>

              {riwayatPreview.length === 0 ? (
                <p className="text-sm text-center py-6 text-[#6E797E]">
                  Belum ada pergerakan stok tercatat.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {riwayatPreview.map((item) => {
                    const isMasuk = item.jenis === "masuk";
                    return (
                      <div
                        key={item.id_histori}
                        className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Badge Type */}
                          <span
                            className={`w-14 text-center text-[10px] font-bold uppercase tracking-wider py-1 px-1.5 rounded shrink-0 ${
                              isMasuk
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {isMasuk ? "Masuk" : "Keluar"}
                          </span>

                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-[#191C1E] truncate">
                              {item.varian.produk.nama_produk}
                            </span>
                            <span className="text-xs text-[#6E797E] truncate">
                              Varian: {item.varian.nama_varian} | Ref: {item.id_referensi?.substring(0, 10) || "Manual"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 pl-2">
                          <span
                            className={`text-sm font-extrabold ${
                              isMasuk ? "text-green-600" : "text-red-500"
                            }`}
                          >
                            {isMasuk ? `+${item.jumlah}` : `-${item.jumlah}`} pcs
                          </span>
                          <span className="text-[10px] text-[#6E797E] mt-0.5">
                            {formatTanggal(item.tanggal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Link
                href="/pemilik/rekap/riwayat"
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-sm font-bold text-[#00647C] bg-cyan-50/50 hover:bg-[#ecfeff] border border-[#00647C]/10 transition-colors cursor-pointer mt-2"
              >
                Lihat Semua Riwayat
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Weekly Insight Section (UC-05/UC-08 Hub) */}
            <div
              className="rounded-2xl p-5 flex flex-col gap-3 text-white border border-cyan-800"
              style={{
                background: "linear-gradient(135deg, #004D61 0%, #00647C 100%)",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/10">
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
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  Insight Mingguan (Mock)
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <h4 className="text-base font-bold">Kaos Myko Terlaris Pekan Ini!</h4>
                <p className="text-xs leading-5 text-cyan-50/80">
                  Varian <strong>Kaos Myko Pingpong (Ukuran M)</strong> terjual paling banyak (sebanyak 12 pcs) dalam 7 hari terakhir. Direkomendasikan untuk mempertahankan reorder point di atas 5 pcs guna menghindari kehabisan stok.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
