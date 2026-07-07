"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopAppBar from "@/components/TopAppBar";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

interface VarianData {
  id_varian?: string; // undefined = new varian
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
  _deleted?: boolean;
}

export default function EditProdukPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [varianList, setVarianList] = useState<VarianData[]>([]);
  const [originalVarian, setOriginalVarian] = useState<VarianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

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

    if (error || !data) {
      console.error("Error fetching produk:", error);
      setLoading(false);
      return;
    }

    setNamaProduk(data.nama_produk);
    setKategori(data.kategori || "");
    const varians = (data.varian || []).map((v: VarianData) => ({
      id_varian: v.id_varian,
      nama_varian: v.nama_varian,
      jumlah_stok: v.jumlah_stok,
      reorder_point: v.reorder_point,
    }));
    setVarianList(varians);
    setOriginalVarian(varians);
    setLoading(false);
  }

  function addVarian() {
    setVarianList([
      ...varianList,
      { nama_varian: "", jumlah_stok: 0, reorder_point: 0 },
    ]);
  }

  function removeVarian(index: number) {
    const activeVarians = varianList.filter((v) => !v._deleted);
    if (activeVarians.length <= 1) return;

    const updated = [...varianList];
    const target = updated[index];

    if (target.id_varian) {
      // Existing varian — mark as deleted
      updated[index] = { ...target, _deleted: true };
    } else {
      // New varian — just remove
      updated.splice(index, 1);
    }
    setVarianList(updated);
  }

  function updateVarianName(index: number, value: string) {
    const updated = [...varianList];
    updated[index] = { ...updated[index], nama_varian: value };
    setVarianList(updated);
    const newErrors = { ...errors };
    delete newErrors[`varian_${index}`];
    setErrors(newErrors);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!namaProduk.trim()) {
      newErrors.nama_produk = "Nama produk wajib diisi.";
    }

    const activeVarians = varianList.filter((v) => !v._deleted);
    if (activeVarians.length === 0) {
      newErrors.varian_general = "Minimal 1 varian harus ada.";
    }

    varianList.forEach((v, i) => {
      if (!v._deleted && !v.nama_varian.trim()) {
        newErrors[`varian_${i}`] = "Nama varian wajib diisi.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSimpan() {
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function confirmSave() {
    setSaving(true);

    // 1. Update produk
    const { error: produkError } = await supabase
      .from("produk")
      .update({
        nama_produk: namaProduk.trim(),
        kategori: kategori.trim() || null,
      })
      .eq("id_produk", id);

    if (produkError) {
      console.error("Error updating produk:", produkError);
      setSaving(false);
      setShowConfirm(false);
      setErrors({ submit: produkError.message });
      return;
    }

    // 2. Process varian changes
    for (const v of varianList) {
      if (v._deleted && v.id_varian) {
        // Delete existing varian
        await supabase.from("varian").delete().eq("id_varian", v.id_varian);
      } else if (v.id_varian) {
        // Update existing varian name
        const original = originalVarian.find(
          (ov) => ov.id_varian === v.id_varian
        );
        if (original && original.nama_varian !== v.nama_varian.trim()) {
          await supabase
            .from("varian")
            .update({ nama_varian: v.nama_varian.trim() })
            .eq("id_varian", v.id_varian);
        }
      } else if (!v._deleted) {
        // Insert new varian
        await supabase.from("varian").insert({
          id_produk: id,
          nama_varian: v.nama_varian.trim(),
          jumlah_stok: 0,
          reorder_point: 0,
        });
      }
    }

    setSaving(false);
    setShowConfirm(false);
    setShowSuccess(true);
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7F9FB]">
        <TopAppBar title="Edit Produk" backHref={`/produk/${id}`} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const activeVarians = varianList.filter((v) => !v._deleted);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FB]">
      <TopAppBar title="Edit Produk" backHref={`/produk/${id}`} />

      {/* Form */}
      <div className="flex-1 px-6 py-6">
        <div className="flex flex-col gap-10">
          {/* Informasi Dasar Section */}
          <section className="flex flex-col gap-3">
            <h2
              className="text-2xl font-semibold leading-8"
              style={{ color: "#00647C" }}
            >
              Informasi Dasar
            </h2>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="nama-produk"
                className="text-sm font-semibold leading-5"
                style={{ color: "#3E484D" }}
              >
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                id="nama-produk"
                type="text"
                value={namaProduk}
                onChange={(e) => {
                  setNamaProduk(e.target.value);
                  if (errors.nama_produk) {
                    const newErrors = { ...errors };
                    delete newErrors.nama_produk;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Contoh: Butterfly Viscaria FL"
                className={`w-full h-12 px-4 text-base bg-white border rounded-lg outline-none transition-colors placeholder:text-[#6B7280] ${
                  errors.nama_produk
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#BDC8CE] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
                }`}
              />
              {errors.nama_produk && (
                <p className="text-sm text-red-500">{errors.nama_produk}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="kategori"
                className="text-sm font-semibold leading-5"
                style={{ color: "#3E484D" }}
              >
                Kategori
              </label>
              <input
                id="kategori"
                type="text"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                placeholder="Contoh: Bat, Rubber, Bola, Apparel"
                className="w-full h-12 px-4 text-base bg-white border border-[#BDC8CE] rounded-lg outline-none transition-colors placeholder:text-[#6B7280] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
              />
            </div>
          </section>

          {/* Varian Section */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2
                className="text-2xl font-semibold leading-8"
                style={{ color: "#00647C" }}
              >
                Varian Produk
              </h2>
              <span className="text-sm" style={{ color: "#6E797E" }}>
                {activeVarians.length} varian aktif
              </span>
            </div>

            {errors.varian_general && (
              <p className="text-sm text-red-500">{errors.varian_general}</p>
            )}

            <div className="flex flex-col gap-3">
              {varianList.map((v, index) => {
                if (v._deleted) return null;

                return (
                  <div
                    key={v.id_varian || `new-${index}`}
                    className="bg-white rounded-lg border border-[#BDC8CE] p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#3E484D" }}
                      >
                        {v.id_varian ? "Varian" : "Varian Baru"}
                        {v.id_varian && v.jumlah_stok > 0 && (
                          <span
                            className="ml-2 text-xs font-normal"
                            style={{ color: "#6E797E" }}
                          >
                            (Stok: {v.jumlah_stok})
                          </span>
                        )}
                      </span>
                      {activeVarians.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVarian(index)}
                          className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                          title={
                            v.jumlah_stok > 0
                              ? "Varian ini masih punya stok"
                              : "Hapus varian"
                          }
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
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-sm font-semibold leading-5"
                        style={{ color: "#3E484D" }}
                      >
                        Nama Varian <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={v.nama_varian}
                        onChange={(e) => updateVarianName(index, e.target.value)}
                        placeholder="Contoh: Ukuran L, Merah, 2.2mm"
                        className={`w-full h-12 px-4 text-base bg-white border rounded-lg outline-none transition-colors placeholder:text-[#6B7280] ${
                          errors[`varian_${index}`]
                            ? "border-red-400 focus:border-red-500"
                            : "border-[#BDC8CE] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
                        }`}
                      />
                      {errors[`varian_${index}`] && (
                        <p className="text-sm text-red-500">
                          {errors[`varian_${index}`]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addVarian}
                className="flex items-center justify-center gap-2 h-11 border-2 border-dashed border-[#BDC8CE] rounded-lg text-sm font-semibold transition-colors hover:border-[#00647C] hover:text-[#00647C] cursor-pointer"
                style={{ color: "#6E797E" }}
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
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Tambah Varian
              </button>
            </div>
          </section>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Button */}
      <div
        className="sticky bottom-[66px] z-30 px-6 py-4 bg-[#F7F9FB]/80 border-t border-[#E6E8EA]"
        style={{ backdropFilter: "blur(12px)" }}
      >
        <button
          type="button"
          onClick={handleSimpan}
          className="w-full h-12 rounded-lg text-white font-semibold text-base cursor-pointer transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "#00647C",
            boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          Simpan Perubahan
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSave}
        title="Simpan Perubahan?"
        message="Pastikan data produk dan varian yang Anda ubah sudah benar sebelum disimpan."
        confirmLabel="Simpan"
        cancelLabel="Batal"
        loading={saving}
      />

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccess}
        onClose={() => router.push(`/produk/${id}`)}
        title="Perubahan Berhasil Disimpan!"
        message={`Data produk "${namaProduk}" telah diperbarui.`}
        buttonLabel="Kembali ke Detail Produk"
      />
    </div>
  );
}
