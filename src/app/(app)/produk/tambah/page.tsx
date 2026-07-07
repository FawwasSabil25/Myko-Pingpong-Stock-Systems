"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopAppBar from "@/components/TopAppBar";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

interface VarianInput {
  nama_varian: string;
}

export default function TambahProdukPage() {
  const router = useRouter();
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [varianList, setVarianList] = useState<VarianInput[]>([
    { nama_varian: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  function addVarian() {
    setVarianList([...varianList, { nama_varian: "" }]);
  }

  function removeVarian(index: number) {
    if (varianList.length <= 1) return;
    setVarianList(varianList.filter((_, i) => i !== index));
  }

  function updateVarian(index: number, value: string) {
    const updated = [...varianList];
    updated[index] = { nama_varian: value };
    setVarianList(updated);
    // Clear error for this varian
    const newErrors = { ...errors };
    delete newErrors[`varian_${index}`];
    setErrors(newErrors);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!namaProduk.trim()) {
      newErrors.nama_produk = "Nama produk wajib diisi.";
    }

    varianList.forEach((v, i) => {
      if (!v.nama_varian.trim()) {
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

    // 1. Insert produk
    const { data: produk, error: produkError } = await supabase
      .from("produk")
      .insert({
        nama_produk: namaProduk.trim(),
        kategori: kategori.trim() || null,
      })
      .select()
      .single();

    if (produkError || !produk) {
      console.error("Error inserting produk:", produkError);
      setSaving(false);
      setShowConfirm(false);
      setErrors({ submit: produkError?.message || "Gagal menyimpan produk." });
      return;
    }

    // 2. Insert varian
    const varianData = varianList.map((v) => ({
      id_produk: produk.id_produk,
      nama_varian: v.nama_varian.trim(),
      jumlah_stok: 0,
      reorder_point: 0,
    }));

    const { error: varianError } = await supabase
      .from("varian")
      .insert(varianData);

    if (varianError) {
      console.error("Error inserting varian:", varianError);
      setSaving(false);
      setShowConfirm(false);
      setErrors({ submit: varianError.message });
      return;
    }

    setSaving(false);
    setShowConfirm(false);
    setShowSuccess(true);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FB]">
      <TopAppBar title="Tambah Produk Baru" backHref="/produk" />

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

            <div className="flex flex-col gap-3">
              {varianList.map((v, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-[#BDC8CE] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
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
                      onChange={(e) => updateVarian(index, e.target.value)}
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
