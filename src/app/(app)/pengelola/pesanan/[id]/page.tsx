"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getRole } from "@/lib/role";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

interface Varian {
  id_varian: string;
  nama_varian: string;
  jumlah_stok: number;
  lokasi_penyimpanan: string | null;
  produk: {
    nama_produk: string;
  };
}

interface DetailPesanan {
  id_detail: string;
  jumlah: number;
  varian: Varian;
}

interface Pesanan {
  id_pesanan: string;
  tanggal_input: string;
  status: string;
  resi_url: string | null;
  platform: string;
  no_pesanan: string | null;
  nama_pelanggan: string;
  metode_pengiriman: string;
  catatan: string | null;
  detail_pesanan: DetailPesanan[];
}

export default function PengelolaOrderDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const params = use(paramsPromise);
  const { id } = params;

  const [pesanan, setPesanan] = useState<Pesanan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bottom action bar dialog states (UC-11 preview)
  const [showConfirmKirim, setShowConfirmKirim] = useState(false);
  const [showSuccessKirim, setShowSuccessKirim] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Pastikan Pengelola dapat mengakses
    const role = getRole();
    if (role !== "pengelola") {
      router.replace("/beranda");
      return;
    }

    fetchOrderDetail();
  }, [id, router]);

  async function fetchOrderDetail() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/pesanan/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Pesanan tidak ditemukan.");
        }
        throw new Error("Gagal mengambil detail pesanan.");
      }

      const data = await res.json();
      setPesanan(data);
    } catch (err: any) {
      console.error("Error loading order detail:", err);
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  // Action: Konfirmasi Pengiriman (Real API call)
  async function handleConfirmKirim() {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/pengiriman/${id}/konfirmasi`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal melakukan konfirmasi pengiriman.");
      }

      if (pesanan) {
        setPesanan({
          ...pesanan,
          status: "dikirim",
        });
      }

      setShowConfirmKirim(false);
      setShowSuccessKirim(true);
    } catch (err: any) {
      console.error("Error confirming shipment:", err);
      alert(err.message || "Terjadi kesalahan saat memproses pengiriman.");
    } finally {
      setIsUpdating(false);
    }
  }

  function formatTanggal(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !pesanan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-6 text-center gap-4">
        <p className="text-red-600 font-semibold">{error || "Pesanan tidak ditemukan"}</p>
        <Link
          href="/beranda"
          className="px-4 py-2 bg-[#00647C] text-white rounded text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
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
          href="/beranda"
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
          Detail Pesanan
        </h1>
      </header>

      {/* Main Container */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-[120px]">
        {/* Card 1: Customer Info (Requirement 5) */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-3.5 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <h2 className="text-xs font-bold text-[#6E797E] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            Informasi Pelanggan
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-xs text-[#6E797E] block">Nama Pelanggan</span>
              <span className="font-extrabold text-[#191C1E]">{pesanan.nama_pelanggan}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Metadata Pesanan */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-3.5 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <h2 className="text-xs font-bold text-[#6E797E] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            Rincian Pesanan
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-[#6E797E] block">Platform</span>
              <span className="font-bold text-[#191C1E]">{pesanan.platform}</span>
            </div>
            <div>
              <span className="text-xs text-[#6E797E] block">No. Pesanan / Invoice</span>
              <span className="font-mono font-semibold text-[#191C1E] truncate block">
                {pesanan.no_pesanan || "-"}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6E797E] block">Tanggal Input</span>
              <span className="font-medium text-[#191C1E]">
                {formatTanggal(pesanan.tanggal_input)}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#6E797E] block">Status</span>
              <span
                className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full uppercase mt-0.5 ${
                  pesanan.status === "baru"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                }`}
              >
                {pesanan.status}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Daftar Item */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-3.5 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <h2 className="text-xs font-bold text-[#6E797E] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            Item Barang
          </h2>
          <ul className="flex flex-col gap-3">
            {pesanan.detail_pesanan.map((item) => (
              <li
                key={item.id_detail}
                className="flex items-center justify-between text-sm py-2 border-b border-[#F1F5F9] last:border-0 last:pb-0"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-bold text-[#191C1E] truncate">
                    {item.varian.produk.nama_produk}
                  </span>
                  <span className="text-xs text-[#6E797E]">Varian: {item.varian.nama_varian}</span>
                </div>
                <span className="font-extrabold text-[#191C1E] shrink-0">x{item.jumlah} pcs</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 3b: Catatan Stok Internal (Figma UC-10 Internal Stock Note) */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-3.5 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <h2 className="text-xs font-bold text-[#6E797E] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            Catatan Stok Internal
          </h2>
          <div className="flex flex-col gap-4">
            {pesanan.detail_pesanan.map((item) => {
              const isSufficient = item.varian.jumlah_stok >= item.jumlah;
              const locationText = item.varian.lokasi_penyimpanan 
                ? `di ${item.varian.lokasi_penyimpanan}` 
                : null;

              return (
                <div key={item.id_detail} className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#3E484D]">
                    {item.varian.produk.nama_produk} ({item.varian.nama_varian})
                  </span>
                  {isSufficient ? (
                    <div className="flex items-start gap-2 text-xs font-semibold bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Stok saat ini mencukupi (Tersedia: {item.varian.jumlah_stok} pcs {locationText || <span> — <span className="italic text-amber-700 font-bold">Lokasi belum diisi — cek dengan Pemilik</span></span>}).
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-xs font-semibold bg-red-50 text-red-800 p-3 rounded-lg border border-red-200">
                      <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>
                        Stok tidak mencukupi! (Hanya tersedia: {item.varian.jumlah_stok} pcs {locationText || <span> — <span className="italic text-amber-700 font-bold">Lokasi belum diisi — cek dengan Pemilik</span></span>}).
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Pengiriman & Catatan */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-3.5 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.03)" }}
        >
          <h2 className="text-xs font-bold text-[#6E797E] uppercase tracking-wider border-b border-[#F1F5F9] pb-2">
            Pengiriman & Catatan
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            <div>
              <span className="text-xs text-[#6E797E] block">Metode Pengiriman</span>
              <span className="font-bold text-[#191C1E]">{pesanan.metode_pengiriman}</span>
            </div>
            {pesanan.catatan && (
              <div>
                <span className="text-xs text-[#6E797E] block">Catatan Pesanan</span>
                <p className="italic text-gray-600 font-medium bg-[#F8FAFC] p-3 rounded border border-[#E2E8F0] mt-1">
                  &ldquo;{pesanan.catatan}&rdquo;
                </p>
              </div>
            )}
            <div>
              <span className="text-xs text-[#6E797E] block mb-1">Resi Pengiriman</span>
              {pesanan.resi_url ? (
                <a
                  href={pesanan.resi_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00647C] hover:underline"
                >
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
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                  Lihat Resi PDF
                </a>
              ) : (
                <span className="text-xs text-[#6E797E] italic">Tidak ada resi terlampir</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar (Fixed, UC-10 Catatan D) */}
      <div
        className="fixed bottom-[66px] left-0 right-0 h-20 bg-white border-t border-[#ECEEF0] flex items-center justify-center px-6 max-w-lg mx-auto z-10"
        style={{
          boxShadow: "0px -4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Button: Konfirmasi Pengiriman (Wide, primary, w-full) */}
        <button
          type="button"
          disabled={pesanan.status === "dikirim"}
          onClick={() => setShowConfirmKirim(true)}
          className={`w-full h-12 rounded-lg flex items-center justify-center font-bold text-white transition-opacity select-none ${
            pesanan.status === "dikirim"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#00647C] hover:opacity-95 cursor-pointer"
          }`}
        >
          {pesanan.status === "dikirim" ? "Sudah Dikirim" : "Konfirmasi Pengiriman"}
        </button>
      </div>

      {/* Confirm Shipment Dialog */}
      <ConfirmDialog
        open={showConfirmKirim}
        onClose={() => setShowConfirmKirim(false)}
        onConfirm={handleConfirmKirim}
        title="Konfirmasi Pengiriman"
        message="Apakah Anda yakin pesanan ini sudah dikemas dan diserahkan ke jasa pengiriman?"
        confirmLabel="Ya, Kirim"
        cancelLabel="Batal"
        loading={isUpdating}
      />

      {/* Success Shipment Dialog */}
      <SuccessDialog
        open={showSuccessKirim}
        onClose={() => setShowSuccessKirim(false)}
        title="Pengiriman Dikonfirmasi!"
        message="Status pesanan berhasil diubah menjadi 'dikirim'."
        buttonLabel="Tutup"
      />
    </div>
  );
}
