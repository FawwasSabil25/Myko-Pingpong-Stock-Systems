"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopAppBar from "@/components/TopAppBar";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

interface VarianInput {
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
  lokasi_penyimpanan: string;
}

export default function TambahProdukPage() {
  const router = useRouter();
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [harga, setHarga] = useState("");
  const [varianList, setVarianList] = useState<VarianInput[]>([
    { nama_varian: "", jumlah_stok: 0, reorder_point: 5, lokasi_penyimpanan: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function addVarian() {
    setVarianList([
      ...varianList,
      { nama_varian: "", jumlah_stok: 0, reorder_point: 5, lokasi_penyimpanan: "" },
    ]);
  }

  function removeVarian(index: number) {
    if (varianList.length <= 1) return;
    setVarianList(varianList.filter((_, i) => i !== index));
  }

  function updateVarianField(
    index: number,
    field: keyof VarianInput,
    value: string | number
  ) {
    const updated = [...varianList];
    updated[index] = { ...updated[index], [field]: value };
    setVarianList(updated);
    
    // Clear error for this field
    const newErrors = { ...errors };
    delete newErrors[`varian_${index}`];
    delete newErrors[`varian_${index}_stok`];
    delete newErrors[`varian_${index}_rop`];
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

    varianList.forEach((v, i) => {
      if (!v.nama_varian.trim()) {
        newErrors[`varian_${i}`] = "Nama varian wajib diisi.";
      }
      if (v.jumlah_stok < 0) {
        newErrors[`varian_${i}_stok`] = "Stok tidak boleh negatif.";
      }
      if (v.reorder_point <= 0) {
        newErrors[`varian_${i}_rop`] = "Min. stok (reorder point) harus lebih besar dari 0.";
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

    try {
      // 1. Insert produk
      const { data: produk, error: produkError } = await supabase
        .from("produk")
        .insert({
          nama_produk: namaProduk.trim(),
          kategori: kategori.trim() || null,
          harga: harga.trim() !== "" ? parseFloat(harga) : null,
        })
        .select()
        .single();

      if (produkError || !produk) {
        console.error("Error inserting produk:", produkError);
        throw new Error(produkError?.message || "Gagal menyimpan produk.");
      }

      // 2. Insert varian
      const varianData = varianList.map((v) => ({
        id_produk: produk.id_produk,
        nama_varian: v.nama_varian.trim(),
        jumlah_stok: v.jumlah_stok,
        reorder_point: v.reorder_point,
        lokasi_penyimpanan: v.lokasi_penyimpanan.trim() || null,
      }));

      const { data: insertedVariants, error: varianError } = await supabase
        .from("varian")
        .insert(varianData)
        .select();

      if (varianError || !insertedVariants) {
        console.error("Error inserting varian:", varianError);
        throw new Error(varianError?.message || "Gagal menyimpan varian.");
      }

      // 3. Catat history stok masuk jika stok awal > 0
      for (let i = 0; i < insertedVariants.length; i++) {
        const inputV = varianList[i];
        const insertedV = insertedVariants[i];

        if (inputV.jumlah_stok > 0) {
          const { error: histError } = await supabase
            .from("histori_stok")
            .insert({
              id_varian: insertedV.id_varian,
              jenis: "masuk",
              jumlah: inputV.jumlah_stok,
              id_referensi: null,
            });

          if (histError) {
            console.error("Error inserting initial stock history:", histError);
          }
        }
      }

      setSaving(false);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error saving product:", err);
      setSaving(false);
      setShowConfirm(false);
      setErrors({ submit: err.message || "Gagal memproses data." });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FB]">
      <TopAppBar title="Tambah Produk Baru" backHref="/produk" />

      {/* Form */}
      <div className="flex-1 px-6 py-6 pb-[120px]">
        <div className="flex flex-col gap-10">
          {/* Informasi Dasar Section */}
          <section className="flex flex-col gap-3">
            <h2
              className="text-2xl font-semibold leading-8"
              style={{ color: "#00647C" }}
            >
              Informasi Dasar
            </h2>

            {/* Nama Produk */}
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
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                    : "border-[#BDC8CE] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
                }`}
              />
              {errors.nama_produk && (
                <p className="text-sm text-red-500">{errors.nama_produk}</p>
              )}
            </div>

            {/* Kategori */}
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

            {/* Harga Jual */}
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
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                    : "border-[#BDC8CE] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
                }`}
              />
              {errors.harga && (
                <p className="text-sm text-red-500">{errors.harga}</p>
              )}
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
                Min. 1 varian
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {varianList.map((v, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-[#BDC8CE] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-[#F7F9FB] border-b border-[#E0E3E5]">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#3E484D" }}
                    >
                      Varian {index + 1}
                    </span>
                    {varianList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVarian(index)}
                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1"
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

                  <div className="px-4 py-4 flex flex-col gap-4">
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

                    {/* Stok Awal stepper */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-sm font-semibold leading-5"
                        style={{ color: "#3E484D" }}
                      >
                        Stok Awal
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => decrementStok(index)}
                          disabled={v.jumlah_stok <= 0}
                          className="w-10 h-10 rounded-lg border border-[#BDC8CE] flex items-center justify-center text-lg font-bold transition-colors cursor-pointer hover:bg-[#F7F9FB] disabled:opacity-30 disabled:cursor-not-allowed"
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
                          className="w-20 h-10 text-center text-base font-semibold bg-white border border-[#BDC8CE] rounded-lg outline-none focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30 tabular-nums"
                          style={{ color: "#191C1E" }}
                        />
                        <button
                          type="button"
                          onClick={() => incrementStok(index)}
                          className="w-10 h-10 rounded-lg border border-[#BDC8CE] flex items-center justify-center text-lg font-bold transition-colors cursor-pointer hover:bg-[#F7F9FB]"
                          style={{ color: "#3E484D" }}
                        >
                          +
                        </button>
                        <span
                          className="text-sm"
                          style={{ color: "#6E797E" }}
                        >
                          pcs
                        </span>
                      </div>
                      {errors[`varian_${index}_stok`] && (
                        <p className="text-sm text-red-500">
                          {errors[`varian_${index}_stok`]}
                        </p>
                      )}
                    </div>

                    {/* Min Stok / Reorder Point */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-sm font-semibold leading-5"
                        style={{ color: "#3E484D" }}
                      >
                        Batas Minimum (Min. Stok)
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
                        className={`w-full h-12 px-4 text-base bg-white border rounded-lg outline-none transition-colors placeholder:text-[#6B7280] ${
                          errors[`varian_${index}_rop`]
                            ? "border-red-400 focus:border-red-500"
                            : "border-[#BDC8CE] focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30"
                        }`}
                      />
                      {errors[`varian_${index}_rop`] && (
                        <p className="text-sm text-red-500">
                          {errors[`varian_${index}_rop`]}
                        </p>
                      )}
                      <p className="text-xs" style={{ color: "#6E797E" }}>
                        Notifikasi akan dikirim jika stok ≤ batas ini
                      </p>
                    </div>

                    {/* Lokasi Penyimpanan */}
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
              ))}

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

          {/* Submit error */}
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
          Simpan Produk
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSave}
        title="Simpan Produk Baru?"
        message="Pastikan data produk dan varian yang Anda masukkan sudah benar sebelum disimpan."
        confirmLabel="Simpan"
        cancelLabel="Batal"
        loading={saving}
      />

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccess}
        onClose={() => router.push("/produk")}
        title="Produk Berhasil Disimpan!"
        message={`${namaProduk} telah ditambahkan ke katalog.`}
        buttonLabel="Kembali ke Daftar Produk"
      />
    </div>
  );
}
