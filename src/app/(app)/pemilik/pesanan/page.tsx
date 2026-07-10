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
    harga?: number | null;
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
      // Show only active orders (status = 'baru')
      const active = (data || []).filter((p: any) => p.status === "baru");
      setPesananList(active);
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main Container */}
      <div className="flex-1 px-6 py-6 pb-[100px] flex flex-col gap-6 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1
              className="text-[30px] font-bold leading-[38px]"
              style={{ color: "#191C1E", fontFamily: "Inter" }}
            >
              Daftar Pesanan Aktif
            </h1>
            <p className="text-base leading-6" style={{ color: "#3E484D", fontFamily: "Inter" }}>
              Kelola pesanan yang belum dikirim dan butuh konfirmasi.
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

        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Order Statistics Bento (Mini) - Figma Style */}
            <div className="flex flex-col gap-4">
              {/* Card 1: Total Active Orders */}
              <div
                className="rounded-2xl p-6 flex flex-col justify-between"
                style={{
                  height: "130px",
                  backgroundColor: "#007F9D",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <span className="text-sm font-semibold text-[#FAFDFF]" style={{ fontFamily: "Inter" }}>
                  Total Pesanan Aktif
                </span>
                <span className="text-[48px] font-bold leading-[58px] text-[#FAFDFF]" style={{ fontFamily: "Inter" }}>
                  {pesananList.length}
                </span>
              </div>

              {/* Card 2: Prioritas Tinggi */}
              <div
                className="rounded-2xl p-6 flex flex-col justify-between border bg-white"
                style={{
                  height: "146px",
                  borderColor: "#BDC8CE",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#3E484D]" style={{ fontFamily: "Inter" }}>
                    PRIORITAS TINGGI
                  </span>
                  <span className="text-2xl font-semibold text-[#BA1A1A]" style={{ fontFamily: "Inter" }}>
                    {pesananList.length} Pesanan
                  </span>
                </div>
                <span className="text-sm font-semibold text-[#BA1A1A]" style={{ fontFamily: "Inter" }}>
                  Perlu segera diproses
                </span>
              </div>
            </div>

            {/* Orders List */}
            {pesananList.length === 0 ? (
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
              <div className="flex flex-col gap-6">
                {pesananList.map((pesanan) => {
                  const totalPrice = pesanan.detail_pesanan.reduce((sum, d) => {
                    const price = d.varian.produk.harga || 0;
                    return sum + (price * d.jumlah);
                  }, 0);

                  const firstItem = pesanan.detail_pesanan[0];
                  const firstItemText = firstItem 
                    ? `${firstItem.varian.produk.nama_produk} (${firstItem.varian.nama_varian})` 
                    : "-";
                  const qtyText = firstItem 
                    ? `Jumlah: ${firstItem.jumlah} Unit` 
                    : "";

                  return (
                    <div
                      key={pesanan.id_pesanan}
                      className="bg-white rounded-2xl border border-[#BDC8CE] overflow-hidden flex flex-col"
                      style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)" }}
                    >
                      {/* Card Body */}
                      <div className="p-6 flex flex-col gap-4">
                        {/* Row 1: Header Info & Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs text-[#6E797E]">Order ID:</span>
                            <span className="text-base font-bold text-[#00647C] leading-5">
                              {pesanan.no_pesanan || `#ORD-${pesanan.id_pesanan.slice(0, 8).toUpperCase()}`}
                            </span>
                            <h3 className="text-lg font-semibold text-[#191C1E] mt-1.5 leading-6">
                              {pesanan.nama_pelanggan}
                            </h3>
                          </div>

                          {/* Menunggu Konfirmasi Badge */}
                          <span
                            className="text-xs font-bold px-4 py-1.5 rounded-full shrink-0 text-center"
                            style={{
                              backgroundColor: "#FFDCBF",
                              color: "#2D1600",
                            }}
                          >
                            Menunggu Konfirmasi
                          </span>
                        </div>

                        {/* Image Placeholder - Figma style */}
                        <div className="w-full h-[128px] bg-[#ECEEF0] rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-[#E0E3E5]">
                          <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#94A3B8"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m6 12 6-6 6 6" />
                            <path d="m12 6v12" />
                          </svg>
                        </div>

                        {/* Details Grey Box */}
                        <div className="bg-[#ECEEF0] rounded-lg p-4 flex flex-col gap-3">
                          <div>
                            <span className="text-xs font-semibold text-[#3E484D]">
                              Produk
                            </span>
                            <p className="text-sm font-medium text-[#191C1E] mt-0.5">
                              {firstItemText}
                            </p>
                            <p className="text-xs text-[#3E484D] mt-0.5">
                              {qtyText}
                            </p>
                            {pesanan.detail_pesanan.length > 1 && (
                              <p className="text-xs font-semibold text-[#00647C] mt-1">
                                + {pesanan.detail_pesanan.length - 1} item lainnya
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

                      {/* Footer Action Bar - Figma style single outline button */}
                      <div className="bg-[#F2F4F6] border-t border-[#BDC8CE] px-6 py-4 flex items-center shrink-0">
                        <Link
                          href={`/pemilik/pesanan/${pesanan.id_pesanan}`}
                          className="h-11 px-6 border border-[#00647C] text-[#00647C] rounded-lg flex items-center justify-center text-xs font-semibold hover:bg-[#00647C]/5 transition-colors"
                          style={{ width: "125px" }}
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
