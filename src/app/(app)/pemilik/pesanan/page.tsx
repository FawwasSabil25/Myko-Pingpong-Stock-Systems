"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRole } from "@/lib/role";

interface Varian {
  id_varian: string;
  nama_varian: string;
  produk: {
    id_produk: string;
    nama_produk: string;
    kategori: string | null;
  };
}

interface DetailPesanan {
  id_detail: string;
  id_varian: string;
  jumlah: number;
  varian: Varian;
}

interface Pesanan {
  id_pesanan: string;
  tanggal_input: string;
  status: string;
  resi_url: string | null;
  created_at: string;
  platform?: string;
  no_pesanan?: string | null;
  nama_pelanggan?: string;
  metode_pengiriman?: string;
  catatan?: string | null;
  detail_pesanan: DetailPesanan[];
}

export default function PemilikPesananPage() {
  const router = useRouter();
  const [pesananList, setPesananList] = useState<Pesanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pastikan hanya Pemilik yang bisa mengakses halaman ini
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }

    fetchPesanan();
  }, [router]);

  async function fetchPesanan() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/pesanan");
      if (!res.ok) {
        throw new Error("Gagal mengambil data pesanan.");
      }
      const data = await res.json();
      setPesananList(data || []);
    } catch (err: any) {
      console.error("Error fetching pesanan:", err);
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }

  function formatTanggal(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTotalItems(pesanan: Pesanan) {
    return pesanan.detail_pesanan.reduce((sum, item) => sum + item.jumlah, 0);
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main Canvas */}
      <div className="flex flex-col gap-6 p-6">
        {/* Page Header & Actions */}
        <div className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col gap-1">
            <h1
              className="text-[30px] font-bold leading-[38px]"
              style={{ color: "#191C1E" }}
            >
              Daftar Pesanan Aktif
            </h1>
            <p className="text-base leading-6" style={{ color: "#3E484D" }}>
              Daftar seluruh pesanan baru masuk yang belum dikirim oleh pengelola.
            </p>
          </div>

          <Link
            href="/pemilik/pesanan/baru"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold text-white rounded-lg self-start transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: "#00647C",
              boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            Input Pesanan Masuk
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
              <path d="M12 5v14" />
            </svg>
          </Link>
        </div>

        {/* Error State */}
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
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchPesanan}
              className="text-xs font-semibold px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : pesananList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(236, 254, 255, 0.5)" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0891B2"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <circle cx="10" cy="13" r="1" />
                <circle cx="10" cy="17" r="1" />
                <path d="M14 13h2" />
                <path d="M14 17h2" />
              </svg>
            </div>
            <p className="text-base font-semibold" style={{ color: "#191C1E" }}>
              Tidak Ada Pesanan Aktif
            </p>
            <p className="text-sm text-center" style={{ color: "#6E797E" }}>
              Semua pesanan masuk sudah dikirim atau belum di-input.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pesananList.map((pesanan) => {
              const totalItems = getTotalItems(pesanan);

              return (
                <div
                  key={pesanan.id_pesanan}
                  className="bg-white rounded-xl p-[17px] flex flex-col gap-4"
                  style={{
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
                    border: "1px solid #ECEEF0",
                  }}
                >
                  {/* Row 1: Date & Status Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E0E3E5]">
                    <div className="flex flex-col">
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "#6E797E" }}
                      >
                        ID: {pesanan.id_pesanan.substring(0, 8)}...
                      </span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#191C1E" }}
                      >
                        {formatTanggal(pesanan.tanggal_input)}
                      </span>
                    </div>

                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full uppercase"
                      style={{
                        backgroundColor: "#E0F2FE",
                        color: "#0284C7",
                      }}
                    >
                      {pesanan.status}
                    </span>
                  </div>

                  {/* Row 1b: Customer, Platform, Shipping details (New) */}
                  <div className="flex flex-col gap-1.5 text-xs text-[#3E484D] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                    <div>
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">Pelanggan</span>
                      <span className="font-bold text-[#191C1E] text-sm">{pesanan.nama_pelanggan || "-"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F1F5F9] mt-1">
                      <div>
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">Platform</span>
                        <span className="font-semibold text-[#191C1E]">{pesanan.platform || "-"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">No. Pesanan</span>
                        <span className="font-mono text-[#191C1E] truncate block">{pesanan.no_pesanan || "-"}</span>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-[#F1F5F9] mt-1">
                      <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">Metode Pengiriman</span>
                      <span className="font-semibold text-[#191C1E]">{pesanan.metode_pengiriman || "-"}</span>
                    </div>
                    {pesanan.catatan && (
                      <div className="pt-1.5 border-t border-[#F1F5F9] mt-1">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">Catatan</span>
                        <p className="italic text-gray-600 font-medium bg-white p-2 rounded border border-[#E2E8F0] mt-0.5">
                          &ldquo;{pesanan.catatan}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Detail Items */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-xs font-bold uppercase text-[#6E797E]">
                      Item Pesanan ({totalItems} pcs)
                    </span>
                    <ul className="flex flex-col gap-2">
                      {pesanan.detail_pesanan.map((item) => (
                        <li
                          key={item.id_detail}
                          className="flex items-center justify-between text-sm py-1 border-b border-[#F1F5F9] last:border-0"
                        >
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-medium truncate"
                              style={{ color: "#191C1E" }}
                            >
                              {item.varian.produk.nama_produk}
                            </span>
                            <span className="text-xs" style={{ color: "#6E797E" }}>
                              Varian: {item.varian.nama_varian}
                            </span>
                          </div>
                          <span
                            className="font-semibold text-right shrink-0"
                            style={{ color: "#191C1E" }}
                          >
                            x{item.jumlah}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Row 3: Receipt PDF Link */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#E0E3E5] text-xs">
                    <div className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={pesanan.resi_url ? "#10B981" : "#94A3B8"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      </svg>
                      <span
                        className="font-medium"
                        style={{ color: pesanan.resi_url ? "#10B981" : "#6E797E" }}
                      >
                        {pesanan.resi_url ? "Resi Pengiriman Tersedia" : "Tanpa Resi"}
                      </span>
                    </div>

                    {pesanan.resi_url && (
                      <a
                        href={pesanan.resi_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline hover:opacity-85"
                        style={{ color: "#00647C" }}
                      >
                        Lihat Resi PDF
                      </a>
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
