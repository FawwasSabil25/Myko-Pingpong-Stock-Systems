"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DetailHeader } from "@/components/DetailHeader";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";
import { TruckIcon, FileUpIcon } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";

interface DetailPesanan {
  id_detail: string;
  jumlah: number;
  varian: {
    id_varian: string;
    nama_varian: string;
    jumlah_stok: number;
    reorder_point: number;
    lokasi_penyimpanan?: string | null;
    produk: {
      nama_produk: string;
      harga?: number | null;
    };
  };
}

interface OrderDetail {
  id_pesanan: string;
  tanggal_input: string;
  status: string;
  platform: string;
  no_pesanan?: string | null;
  nama_pelanggan: string;
  metode_pengiriman: string;
  catatan?: string | null;
  resi_url?: string | null;
  detail_pesanan: DetailPesanan[];
}

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function DetailPesananPengelolaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/pesanan/${id}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data pesanan.");
      }

      const data = await res.json();
      setOrder(data);
    } catch (err: unknown) {
      console.error("Error fetching order:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function handleConfirmShipment() {
    setConfirming(true);
    try {
      const res = await fetch(`/api/pengiriman/${id}/konfirmasi`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengonfirmasi pengiriman.");
      }

      setConfirming(false);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error confirming shipment:", err);
      setConfirming(false);
      setShowConfirm(false);
      alert(`Gagal mengonfirmasi pengiriman:\n${err.message}`);
    }
  }

  if (loading) {
    return (
      <MobileShell header={<DetailHeader title="Proses Pesanan" backTo="/pesanan" />}>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
        </div>
      </MobileShell>
    );
  }

  if (error || !order) {
    return (
      <MobileShell header={<DetailHeader title="Proses Pesanan" backTo="/pesanan" />}>
        <main className="px-5 py-10 text-center max-w-md mx-auto">
          <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-8 text-center shadow-card space-y-3">
            <p className="text-base font-extrabold text-brand-900">{error || "Pesanan tidak ditemukan."}</p>
            <button
              onClick={fetchOrder}
              className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 px-5 py-3 text-xs font-bold text-white shadow-lift"
            >
              Coba Lagi
            </button>
          </div>
        </main>
      </MobileShell>
    );
  }

  const isShipped = order.status === "dikirim" || order.status === "selesai";
  const totalPrice = order.detail_pesanan.reduce((sum, d) => {
    const price = d.varian.produk.harga || 0;
    return sum + price * d.jumlah;
  }, 0);

  return (
    <MobileShell header={<DetailHeader title="Detail Pesanan Pengelola" backTo="/pesanan" />}>
      <main className="px-5 pb-24 pt-6 max-w-md mx-auto space-y-5">
        {/* Header Status Card */}
        <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-white via-white to-brand-100 p-5 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
              {order.no_pesanan || `#ORD-${order.id_pesanan.slice(0, 8).toUpperCase()}`}
            </p>
            <h2 className="text-xl font-extrabold text-brand-900 mt-0.5">
              {order.nama_pelanggan || "(Tanpa nama)"}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {order.platform} · {new Date(order.tanggal_input).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-bold",
              isShipped
                ? "bg-gradient-to-r from-positive-50 to-brand-100 text-positive-600"
                : "bg-gradient-to-r from-warn-50 to-warn-100 text-warn-700",
            ].join(" ")}
          >
            {isShipped ? "Dikirim" : "Baru"}
          </span>
        </section>

        {/* Item Pesanan & Lokasi Rak Card */}
        <section className="rounded-3xl border border-brand-200 bg-white p-5 shadow-card space-y-4">
          <h2 className="text-lg font-extrabold tracking-tight text-brand-900">
            Daftar Item & Lokasi Penyimpanan
          </h2>

          <div className="space-y-3">
            {order.detail_pesanan.map((item) => (
              <div
                key={item.id_detail}
                className="rounded-2xl border border-brand-200 bg-brand-50 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-brand-900">
                      {item.varian.produk.nama_produk}
                    </h3>
                    <p className="text-xs font-bold text-brand-700 mt-0.5">
                      Varian: {item.varian.nama_varian}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-brand-900 border border-brand-200">
                    x{item.jumlah}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-brand-200 text-xs">
                  <span className="font-semibold text-slate-600">Lokasi Rak:</span>
                  <span className="font-extrabold text-brand-900 bg-white px-2 py-0.5 rounded border border-brand-300">
                    {item.varian.lokasi_penyimpanan || "Tidak diset"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-brand-200 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Total Pembayaran:</span>
            <span className="text-lg font-extrabold text-brand-900">
              {currency.format(totalPrice)}
            </span>
          </div>
        </section>

        {/* Pengiriman & Resi */}
        <section className="rounded-3xl border border-brand-200 bg-white p-5 shadow-card space-y-4">
          <h2 className="text-lg font-extrabold tracking-tight text-brand-900">
            Informasi Pengiriman
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Metode Pengiriman:</span>
              <span className="font-bold text-brand-900">{order.metode_pengiriman}</span>
            </div>

            {order.catatan && (
              <div className="pt-2 border-t border-brand-100">
                <p className="text-xs font-semibold text-slate-500">Catatan Pemilik:</p>
                <p className="text-sm font-medium text-brand-900 mt-0.5">{order.catatan}</p>
              </div>
            )}

            {order.resi_url && (
              <div className="pt-3 border-t border-brand-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-700">Lampiran File Resi PDF:</span>
                <a
                  href={order.resi_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 underline hover:text-brand-800"
                >
                  <FileUpIcon className="h-4 w-4" /> Buka PDF Resi
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Confirmation Button */}
        <div className="pt-2">
          {!isShipped ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-brand-900 px-5 py-4 text-base font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 cursor-pointer"
            >
              <TruckIcon className="h-5 w-5" strokeWidth={2.2} />
              Konfirmasi Pengiriman Pesanan
            </button>
          ) : (
            <div className="rounded-2xl border border-positive-600/20 bg-positive-50 p-4 text-center">
              <p className="text-sm font-bold text-positive-600">
                ✓ Pesanan ini telah dikonfirmasi dan dikirim.
              </p>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmShipment}
        title="Konfirmasi Pengiriman Pesanan?"
        message="Stok barang akan otomatis dipotong dari inventaris dan tercatat dalam riwayat stok keluar."
        confirmLabel="Konfirmasi Dikirim"
        cancelLabel="Batal"
        loading={confirming}
      />

      <SuccessDialog
        open={showSuccess}
        onClose={() => router.push("/pesanan")}
        title="Pengiriman Berhasil Dikonfirmasi!"
        message="Stok barang telah dipotong dan status pesanan diperbarui menjadi Dikirim."
        buttonLabel="Kembali ke Daftar Pesanan"
      />
    </MobileShell>
  );
}