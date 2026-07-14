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
  lokasi_penyimpanan: string;
  _deleted?: boolean;
}

export default function EditProdukPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [harga, setHarga] = useState("");
  const [varianList, setVarianList] = useState<VarianData[]>([]);
  const [originalVarian, setOriginalVarian] = useState<VarianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setUploadingFoto(true);
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch("/api/produk/upload-foto", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal mengunggah foto.");
        }
        
        const data = await res.json();
        setFotoUrl(data.publicUrl);
      } catch (err: any) {
        console.error("Error uploading photo:", err);
        setErrors({ ...errors, foto: err.message || "Gagal mengunggah foto." });
      } finally {
        setUploadingFoto(false);
      }
    }
  }

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
    setHarga(data.harga ? String(data.harga) : "");
    setFotoUrl(data.foto_url || null);
    const varians = (data.varian || []).map((v: VarianData) => ({
      id_varian: v.id_varian,
      nama_varian: v.nama_varian,
      jumlah_stok: v.jumlah_stok,
      reorder_point: v.reorder_point,
      lokasi_penyimpanan: v.lokasi_penyimpanan || "",
    }));
    setVarianList(varians);
    setOriginalVarian(varians);
    setLoading(false);
  }

  function addVarian() {
    setVarianList([
      ...varianList,
      { nama_varian: "", jumlah_stok: 0, reorder_point: 0, lokasi_penyimpanan: "" },
    ]);
  }

  function removeVarian(index: number) {
    const activeVarians = varianList.filter((v) => !v._deleted);
    if (activeVarians.length <= 1) return;

    const updated = [...varianList];
    const target = updated[index];

    if (target.id_varian) {
      updated[index] = { ...target, _deleted: true };
    } else {
      updated.splice(index, 1);
    }
    setVarianList(updated);
  }

  function updateVarianField(index: number, field: keyof VarianData, value: string | number) {
    const updated = [...varianList];
    updated[index] = { ...updated[index], [field]: value };
    setVarianList(updated);
    const newErrors = { ...errors };
    delete newErrors[`varian_${index}`];
    delete newErrors[`varian_${index}_rop`];
    delete newErrors[`varian_${index}_stok`];
    setErrors(newErrors);
  }

  function incrementStok(index: number) {
    const current = varianList[index].jumlah_stok;
    updateVarianField(index, "jumlah_stok", current + 1);
  }

  function decrementStok(index: number) {
    const current = varianList[index].jumlah_stok;
    if (current > 0) {
      updateVarianField(index, "jumlah_stok", current - 1);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!namaProduk.trim()) {
      newErrors.nama_produk = "Nama produk wajib diisi.";
    }

    if (harga && (isNaN(Number(harga)) || Number(harga) < 0)) {
      newErrors.harga = "Harga jual harus berupa angka positif.";
    }

    const activeVarians = varianList.filter((v) => !v._deleted);
    if (activeVarians.length === 0) {
      newErrors.varian_general = "Minimal 1 varian harus ada.";
    }

    varianList.forEach((v, i) => {
      if (v._deleted) return;

      if (!v.nama_varian.trim()) {
        newErrors[`varian_${i}`] = "Nama varian wajib diisi.";
      }

      // Business Rule #1: stok tidak boleh negatif
      if (v.jumlah_stok < 0) {
        newErrors[`varian_${i}_stok`] = "Stok tidak boleh negatif.";
      }

      // Business Rule #2: reorder_point tidak boleh ≤ 0 saat disimpan
      if (v.reorder_point <= 0) {
        newErrors[`varian_${i}_rop`] = "Batas minimum (reorder point) harus lebih besar dari 0.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSimpan() {
    if (!validate()) return;
    setShowConfirm(true);
  }

  /**
   * Stub: Cek Reorder Point (UC-06 trigger — akan diisi di Tahap 2)
   */
  function cekReorderPoint(
    idVarian: string,
    namaVarian: string,
    jumlahStok: number,
    reorderPoint: number
  ) {
    if (reorderPoint > 0 && jumlahStok <= reorderPoint) {
      console.log(
        `[STUB UC-06] Notifikasi Stok Menipis — Varian "${namaVarian}" (${idVarian}): ` +
          `stok=${jumlahStok}, reorder_point=${reorderPoint}. ` +
          `Akan kirim WA ke Pemilik di Tahap 2.`
      );
    }
  }

  async function confirmSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/produk/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_produk: namaProduk,
          kategori: kategori,
          harga: harga.trim() !== "" ? parseFloat(harga) : null,
          foto_url: fotoUrl,
          varian: varianList,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan perubahan.");
      }

      setSaving(false);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error saving product changes:", err);
      setSaving(false);
      setShowConfirm(false);
      setErrors({ submit: err.message || "Terjadi kesalahan koneksi server." });
    }
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

            <div className="flex flex-col gap-2">
              <label
                htmlFor="harga"
                className="text-sm font-semibold leading-5"
                style={{ color: "#3E484D" }}
              >
                Harga Jual (Rp)
              </label>
              <input
                id="harga"
                type="text"
                value={harga}
                onChange={(e) => {
                  setHarga(e.target.value);
                  if (errors.harga) {
                    const newErrors = { ...errors };
                    delete newErrors.harga;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Contoh: 750000"
                className={`w-full h-12 px-4 text-base bg-white border rounded-lg outline-none transition-colors placeholder:text-[#6B7280] ${
                  errors.harga
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#BDC8CE] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
                }`}
              />
              {errors.harga && (
                <p className="text-sm text-red-500">{errors.harga}</p>
              )}
            </div>
          </section>

          {/* Section: Foto Produk */}
          <section className="flex flex-col gap-3">
            <h2
              className="text-2xl font-semibold leading-8"
              style={{ color: "#00647C" }}
            >
              Foto Produk
            </h2>
            <div className="bg-white rounded-xl border border-[#BDC8CE] p-6 flex flex-col items-center gap-4">
              {fotoUrl ? (
                <div className="w-32 h-32 relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <img
                    src={fotoUrl}
                    alt="Preview produk"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoUrl(null);
                      setFotoFile(null);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-[#BDC8CE] flex flex-col items-center justify-center gap-2 bg-[#F7F9FB] text-[#94A3B8]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span className="text-[10px] font-semibold text-center px-2">Belum ada foto</span>
                </div>
              )}

              <label className="h-10 px-4 border border-[#00647C] text-[#00647C] font-semibold text-xs rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#00647C]/5 transition-colors disabled:opacity-50 select-none">
                {uploadingFoto ? "Mengunggah..." : "Pilih Foto"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  disabled={uploadingFoto}
                  className="hidden"
                />
              </label>
              {errors.foto && <p className="text-xs text-red-500 font-semibold">{errors.foto}</p>}
            </div>
          </section>

          {/* Varian Section — extended with UC-04/UC-07 fields */}
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

            <div className="flex flex-col gap-4">
              {varianList.map((v, index) => {
                if (v._deleted) return null;

                const isLowStock =
                  v.reorder_point > 0 && v.jumlah_stok <= v.reorder_point;

                return (
                  <div
                    key={v.id_varian || `new-${index}`}
                    className="bg-white rounded-xl border border-[#BDC8CE] overflow-hidden"
                  >
                    {/* Varian Card Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#F7F9FB] border-b border-[#E0E3E5]">
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#3E484D" }}
                      >
                        {v.id_varian ? `Varian` : "Varian Baru"}
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

                    {/* Varian Card Body */}
                    <div className="px-4 py-4 flex flex-col gap-4">
                      {/* Warning Banner — stok di bawah batas minimum */}
                      {isLowStock && (
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.06)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                          }}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#DC2626"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="shrink-0"
                          >
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                          </svg>
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#DC2626" }}
                          >
                            Stok di bawah batas minimum
                          </span>
                        </div>
                      )}

                      {/* Nama Varian */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-sm font-semibold leading-5"
                          style={{ color: "#3E484D" }}
                        >
                          Nama Varian <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={v.nama_varian}
                          onChange={(e) =>
                            updateVarianField(index, "nama_varian", e.target.value)
                          }
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

                      {/* Stok Saat Ini & Batas Minimum (Reorder Point) Layout Grid (UX 2) */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Stok Saat Ini stepper */}
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-sm font-semibold leading-5"
                            style={{ color: "#3E484D" }}
                          >
                            Stok Saat Ini
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => decrementStok(index)}
                              disabled={v.jumlah_stok <= 0}
                              className="w-8 h-8 rounded border border-[#BDC8CE] flex items-center justify-center font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                              style={{ color: "#3E484D" }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={v.jumlah_stok}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                updateVarianField(
                                  index,
                                  "jumlah_stok",
                                  isNaN(val) ? 0 : Math.max(0, val)
                                );
                              }}
                              className="w-16 h-8 text-center text-sm font-semibold bg-white border border-[#BDC8CE] rounded outline-none focus:border-[#00647C] tabular-nums"
                              style={{ color: "#191C1E" }}
                            />
                            <button
                              type="button"
                              onClick={() => incrementStok(index)}
                              className="w-8 h-8 rounded border border-[#BDC8CE] flex items-center justify-center font-bold text-sm hover:bg-gray-200 transition-colors shrink-0"
                              style={{ color: "#3E484D" }}
                            >
                              +
                            </button>
                            <span className="text-xs text-[#6E797E] shrink-0">pcs</span>
                          </div>
                          {errors[`varian_${index}_stok`] && (
                            <p className="text-xs text-red-500 font-semibold">{errors[`varian_${index}_stok`]}</p>
                          )}
                        </div>

                        {/* Batas Minimum / Reorder Point */}
                        <div className="flex flex-col gap-1.5">
                          <label
                            className="text-sm font-semibold leading-5"
                            style={{ color: "#3E484D" }}
                          >
                            Batas Minimum (Reorder Point)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.reorder_point}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              updateVarianField(
                                index,
                                "reorder_point",
                                isNaN(val) ? 0 : Math.max(0, val)
                              );
                            }}
                            placeholder="5"
                            className={`w-full h-8 px-3 text-sm bg-white border rounded outline-none transition-colors placeholder:text-[#6B7280] ${
                              errors[`varian_${index}_rop`]
                                ? "border-red-400 focus:border-red-500"
                                : "border-[#BDC8CE] focus:border-[#00647C]"
                            }`}
                          />
                          {errors[`varian_${index}_rop`] && (
                            <p className="text-xs text-red-500 font-semibold">{errors[`varian_${index}_rop`]}</p>
                          )}
                        </div>
                      </div>

                      {/* Lokasi Barang Disimpan */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="text-sm font-semibold leading-5"
                          style={{ color: "#3E484D" }}
                        >
                          Lokasi Barang Disimpan
                        </label>
                        <input
                          type="text"
                          value={v.lokasi_penyimpanan}
                          onChange={(e) =>
                            updateVarianField(
                              index,
                              "lokasi_penyimpanan",
                              e.target.value
                            )
                          }
                          placeholder="Contoh: Rak A1, Gudang B"
                          className="w-full h-12 px-4 text-base bg-white border border-[#BDC8CE] rounded-lg outline-none transition-colors placeholder:text-[#6B7280] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
                        />
                      </div>
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
