"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import TopAppBar from "@/components/TopAppBar";
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
  varian: Varian[];
}

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
      console.error("Error deleting produk:", error);
      setDeleting(false);
      return;
    }

    setDeleting(false);
    setShowDeleteConfirm(false);
    setShowStockWarning(false);
    setShowDeleteSuccess(true);
  }

  function getTotalStok() {
    if (!produk) return 0;
    return produk.varian.reduce((sum, v) => sum + v.jumlah_stok, 0);
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <TopAppBar title="Detail Produk" backHref="/produk" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!produk) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <TopAppBar title="Detail Produk" backHref="/produk" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
          <p className="text-base font-medium" style={{ color: "#191C1E" }}>
            Produk tidak ditemukan
          </p>
          <Link
            href="/produk"
            className="text-sm font-semibold"
            style={{ color: "#00647C" }}
          >
            Kembali ke daftar produk
          </Link>
        </div>
      </div>
    );
  }

  const totalStok = getTotalStok();
  const varianWithStock = produk.varian.filter((v) => v.jumlah_stok > 0);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopAppBar title={produk.nama_produk} backHref="/produk" />

      <div className="flex-1 px-6 py-6 flex flex-col gap-6">
        {/* Product Info Card */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-4"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-start gap-4">
            {/* Product icon */}
            <div className="w-20 h-20 rounded-lg bg-[#ECEEF0] flex items-center justify-center shrink-0">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              {produk.kategori && (
                <span
                  className="self-start text-[10px] leading-[15px] px-2 py-0.5 rounded-sm"
                  style={{ backgroundColor: "#E0E3E5", color: "#3E484D" }}
                >
                  {produk.kategori.toUpperCase()}
                </span>
              )}
              <h2
                className="text-xl font-semibold leading-7 truncate"
                style={{ color: "#191C1E" }}
              >
                {produk.nama_produk}
              </h2>
              <p className="text-sm" style={{ color: "#6E797E" }}>
                Ditambahkan{" "}
                {new Date(produk.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Stock summary */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#E0E3E5]">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: totalStok > 0 ? "#22C55E" : "#EF4444",
              }}
            />
            <span
              className="text-base font-semibold"
              style={{ color: "#191C1E" }}
            >
              Total Stok: {totalStok} pcs
            </span>
          </div>
        </div>

        {/* Stok per Varian — UC-02 */}
        <div className="flex flex-col gap-3">
          <h3
            className="text-lg font-semibold leading-6"
            style={{ color: "#00647C" }}
          >
            Stok per Varian
          </h3>

          {produk.varian.length === 0 ? (
            <p className="text-sm py-4" style={{ color: "#6E797E" }}>
              Belum ada varian untuk produk ini.
            </p>
          ) : (
            <div
              className="bg-white rounded-xl overflow-hidden"
              style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }}
            >
              {/* Table Header */}
              <div
                className="grid grid-cols-[1fr_70px_70px_80px] gap-2 px-4 py-3"
                style={{ backgroundColor: "#F7F9FB" }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#6E797E" }}
                >
                  Varian
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-wider text-center"
                  style={{ color: "#6E797E" }}
                >
                  Stok
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-wider text-center"
                  style={{ color: "#6E797E" }}
                >
                  ROP
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-wider text-center"
                  style={{ color: "#6E797E" }}
                >
                  Status
                </span>
              </div>

              {/* Table Rows */}
              {produk.varian.map((v, idx) => {
                const isLow =
                  v.reorder_point > 0 && v.jumlah_stok <= v.reorder_point;

                return (
                  <div
                    key={v.id_varian}
                    className={`grid grid-cols-[1fr_70px_70px_80px] gap-2 px-4 py-3.5 items-center ${
                      idx < produk.varian.length - 1
                        ? "border-b border-[#E0E3E5]"
                        : ""
                    }`}
                    style={{
                      backgroundColor: isLow
                        ? "rgba(239, 68, 68, 0.04)"
                        : "transparent",
                    }}
                  >
                    {/* Variant name & Storage Location */}
                    <div className="flex flex-col min-w-0">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "#191C1E" }}
                      >
                        {v.nama_varian}
                      </span>
                      {v.lokasi_penyimpanan && (
                        <span
                          className="text-[11px] truncate leading-4 font-normal"
                          style={{ color: "#6E797E" }}
                          title={v.lokasi_penyimpanan}
                        >
                          Lokasi: {v.lokasi_penyimpanan}
                        </span>
                      )}
                    </div>

                    {/* Stock count */}
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: isLow ? "#EF4444" : "#22C55E",
                        }}
                      />
                      <span
                        className="text-sm font-semibold tabular-nums"
                        style={{
                          color: isLow ? "#DC2626" : "#3E484D",
                        }}
                      >
                        {v.jumlah_stok}
                      </span>
                    </div>

                    {/* Reorder point */}
                    <span
                      className="text-sm text-center tabular-nums"
                      style={{ color: "#6E797E" }}
                    >
                      {v.reorder_point}
                    </span>

                    {/* Status badge */}
                    <div className="flex justify-center">
                      <span
                        className="text-[11px] leading-[16px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: isLow
                            ? "rgba(239, 68, 68, 0.1)"
                            : "rgba(34, 197, 94, 0.1)",
                          color: isLow ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {isLow ? "Rendah" : "Aman"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <Link
            href={`/produk/${id}/edit`}
            className="flex items-center justify-center gap-2 h-12 rounded-lg text-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#00647C",
              boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
            Edit Produk
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 h-12 rounded-lg font-semibold text-base border border-red-200 text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Hapus Produk
          </button>
        </div>
      </div>

      {/* SR-04: Stock Warning Dialog */}
      <ConfirmDialog
        open={showStockWarning}
        onClose={() => setShowStockWarning(false)}
        onConfirm={confirmDelete}
        title="Produk Masih Memiliki Stok!"
        message={`Produk ini masih memiliki ${varianWithStock.length} varian dengan total stok ${totalStok} pcs. Menghapus produk akan menghapus semua data varian dan stoknya secara permanen. Lanjutkan?`}
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
