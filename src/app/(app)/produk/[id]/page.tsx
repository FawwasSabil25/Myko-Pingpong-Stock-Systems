"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PencilLineIcon, Trash2Icon, PackageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DetailHeader } from "@/components/DetailHeader";
import { VariantStockTable, type ProductVariant } from "@/components/VariantStockTable";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

interface Varian {
  id_varian: string;
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
  lokasi_penyimpanan?: string | null;
}

interface Produk {
  id_produk: string;
  nama_produk: string;
  kategori: string | null;
  created_at: string;
  updated_at: string;
  harga?: number | null;
  foto_url?: string | null;
  varian: Varian[];
}

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const easing = [0.23, 1, 0.32, 1] as const;

export default function DetailProdukPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [produk, setProduk] = useState<Produk | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProduk();
  }, [id]);

  async function fetchProduk() {
    setLoading(true);
    const { data, error } = await supabase
      .from("produk")
      .select("*, varian(*)")
      .eq("id_produk", id)
      .single();

    if (error) {
      console.error("Error fetching produk:", error);
    } else {
      setProduk(data as Produk);
    }
    setLoading(false);
  }

  function handleDelete() {
    if (!produk) return;

    // SR-04: Check if any varian has stock > 0
    const hasActiveStock = produk.varian.some((v) => v.jumlah_stok > 0);

    if (hasActiveStock) {
      setShowStockWarning(true);
    } else {
      setShowDeleteConfirm(true);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    const { error } = await supabase
      .from("produk")
      .delete()
      .eq("id_produk", id);

    if (error) {
      const errString = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      console.error("RAW Error deleting produk:", errString);
      setDeleting(false);

      if (error.code === "23503" || errString.includes("23503") || errString.includes("foreign key")) {
        alert("Produk tidak bisa dihapus karena sudah memiliki histori stok atau pesanan yang tercatat.\n\nTips: Ubah nama/status produk alih-alih menghapusnya untuk menjaga histori data.");
      } else {
        alert(`Gagal menghapus produk:\n\n${errString}`);
      }
      return;
    }

    setDeleting(false);
    setShowDeleteConfirm(false);
    setShowStockWarning(false);
    setShowDeleteSuccess(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
        <DetailHeader title="Detail Produk" backTo="/produk" />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!produk) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
        <DetailHeader title="Produk" backTo="/produk" />
        <main className="px-5 py-6 max-w-md mx-auto">
          <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-8 text-center shadow-card">
            <p className="text-base font-extrabold text-brand-900">Produk tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-600">
              Data produk mungkin sudah dihapus dari katalog.
            </p>
            <Link
              href="/produk"
              className="mt-5 inline-flex rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 px-5 py-3 text-sm font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95"
            >
              Kembali ke katalog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const totalStock = produk.varian.reduce((sum, v) => sum + v.jumlah_stok, 0);
  const lowVariantsCount = produk.varian.filter(
    (v) => v.reorder_point > 0 && v.jumlah_stok <= v.reorder_point
  ).length;
  const isLow = lowVariantsCount > 0;
  const varianWithStock = produk.varian.filter((v) => v.jumlah_stok > 0);

  const mappedVariants: ProductVariant[] = produk.varian.map((v) => ({
    code: v.nama_varian,
    location: v.lokasi_penyimpanan || "-",
    stock: v.jumlah_stok,
    rop: v.reorder_point,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <DetailHeader title={produk.nama_produk} backTo="/produk" />

      <main className="px-5 pb-24 pt-6 max-w-md mx-auto space-y-6">
        {/* Ringkasan produk */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: easing }}
          className={[
            'rounded-3xl border p-4 shadow-card',
            isLow
              ? 'border-alert-100 bg-gradient-to-br from-alert-50 via-alert-50 to-alert-100'
              : 'border-white/70 bg-gradient-to-br from-white via-white to-brand-100',
          ].join(' ')}
          aria-label="Ringkasan produk"
        >
          <div className="flex gap-4">
            {produk.foto_url ? (
              <img
                src={produk.foto_url}
                alt={produk.nama_produk}
                className="h-24 w-24 shrink-0 rounded-2xl border border-white/70 bg-white object-cover shadow-card"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white text-brand-500 shadow-card">
                <PackageIcon className="h-10 w-10" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-md bg-gradient-to-r from-brand-600 to-brand-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {produk.kategori || 'Umum'}
              </span>
              <h2 className="mt-1.5 text-lg font-extrabold leading-snug text-brand-900">
                {produk.nama_produk}
              </h2>
              {produk.harga !== null && produk.harga !== undefined && (
                <p className="mt-1 text-base font-bold text-brand-600">
                  {currency.format(produk.harga)}
                </p>
              )}
              <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                Ditambahkan {new Date(produk.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          <div className={['mt-4 flex items-center justify-between gap-3 border-t pt-3', isLow ? 'border-alert-100' : 'border-brand-100'].join(' ')}>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className={['h-2.5 w-2.5 rounded-full', isLow ? 'bg-gradient-to-br from-alert-200 to-alert-600' : 'bg-gradient-to-br from-brand-400 to-positive-600'].join(' ')} />
              <span className={['text-sm font-bold', isLow ? 'text-alert-700' : 'text-brand-900'].join(' ')}>
                Total Stok: {totalStock} pcs
              </span>
            </span>
          </div>
        </motion.section>

        {/* Stok per Varian */}
        <section aria-labelledby="variant-title" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="variant-title" className="text-lg font-extrabold tracking-tight text-brand-900">
              Stok per Varian
            </h2>
            {lowVariantsCount > 0 && (
              <span className="rounded-full bg-gradient-to-r from-alert-50 to-alert-100 px-3 py-1 text-xs font-bold text-alert-700">
                {lowVariantsCount} varian rendah
              </span>
            )}
          </div>
          <VariantStockTable variants={mappedVariants} />
          <p className="text-[11px] font-medium text-slate-500">
            ROP = titik pemesanan ulang. Varian di bawah ROP ditandai rendah.
          </p>
        </section>

        {/* Aksi produk */}
        <section className="space-y-3" aria-label="Aksi produk">
          <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.12, ease: easing }}>
            <Link
              href={`/produk/${id}/edit`}
              className="relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-brand-900 px-5 py-4 text-base font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
              <PencilLineIcon className="relative h-5 w-5" strokeWidth={2.2} />
              <span className="relative">Edit Produk</span>
            </Link>
          </motion.div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.12, ease: easing }}
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-alert-200 bg-gradient-to-b from-white to-alert-50 px-5 py-4 text-base font-bold text-alert-600 shadow-card transition-colors duration-150 ease-out hover:to-alert-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert-600 cursor-pointer"
          >
            <Trash2Icon className="h-5 w-5" strokeWidth={2.2} />
            Hapus Produk
          </motion.button>
        </section>
      </main>

      {/* SR-04: Stock Warning Dialog */}
      <ConfirmDialog
        open={showStockWarning}
        onClose={() => setShowStockWarning(false)}
        onConfirm={confirmDelete}
        title="Produk Masih Memiliki Stok!"
        message={`Produk ini masih memiliki ${varianWithStock.length} varian dengan total stok ${totalStock} pcs. Menghapus produk akan menghapus semua data varian dan stoknya secara permanen. Lanjutkan?`}
        confirmLabel="Hapus Tetap"
        cancelLabel="Batal"
        loading={deleting}
        variant="danger"
      />

      {/* Regular Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Hapus Produk?"
        message={`Apakah Anda yakin ingin menghapus "${produk.nama_produk}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        loading={deleting}
        variant="danger"
      />

      {/* Delete Success Dialog */}
      <SuccessDialog
        open={showDeleteSuccess}
        onClose={() => router.push("/produk")}
        title="Produk Berhasil Dihapus!"
        buttonLabel="Kembali ke Daftar Produk"
      />
    </div>
  );
}
