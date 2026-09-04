"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CameraIcon, ChevronDownIcon, PlusIcon, Trash2Icon, MinusIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DetailHeader } from "@/components/DetailHeader";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

interface VarianInput {
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
  lokasi_penyimpanan: string;
}

const fieldClass =
  "w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-medium text-brand-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700";

const labelClass = "block text-xs font-bold text-brand-900";

const sectionTitleClass = "text-base font-extrabold tracking-tight text-brand-900";

export default function TambahProdukPage() {
  const router = useRouter();
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [harga, setHarga] = useState("");
  const [varianList, setVarianList] = useState<VarianInput[]>([
    { nama_varian: "", jumlah_stok: 0, reorder_point: 5, lokasi_penyimpanan: "" },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Autocomplete Category States
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    fetchExistingCategories();
  }, []);

  async function fetchExistingCategories() {
    try {
      const { data, error } = await supabase.from("produk").select("kategori");
      if (!error && data) {
        const cats = Array.from(
          new Set(data.map((p) => p.kategori).filter(Boolean))
        ) as string[];
        setAvailableCategories(cats.sort());
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }

  const filteredCategories = availableCategories.filter((cat) =>
    cat.toLowerCase().includes(kategori.toLowerCase())
  );

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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

    const newErrors = { ...errors };
    delete newErrors[`varian_${index}`];
    delete newErrors[`varian_${index}_stok`];
    delete newErrors[`varian_${index}_rop`];
    setErrors(newErrors);
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
          foto_url: fotoUrl,
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
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <DetailHeader title="Tambah Produk Baru" backTo="/produk" action="close" />

      <main className="px-5 pb-24 pt-6 max-w-md mx-auto">
        <form
          className="space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            handleSimpan();
          }}
        >
          {/* Foto Produk Section */}
          <section className="space-y-2">
            <span className={labelClass}>Foto Produk</span>
            <div className="relative flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-white/70 px-4 py-8 transition-colors duration-150 ease-out hover:bg-white">
              {fotoUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={fotoUrl}
                    alt="Preview produk"
                    className="h-28 w-28 rounded-2xl border border-white/70 object-cover shadow-card"
                  />
                  <button
                    type="button"
                    onClick={() => setFotoUrl(null)}
                    className="text-xs font-bold text-alert-600 hover:underline"
                  >
                    Hapus Foto
                  </button>
                </div>
              ) : (
                <label className="flex w-full flex-col items-center justify-center gap-2 cursor-pointer">
                  <CameraIcon className="h-8 w-8 text-brand-500" strokeWidth={1.8} aria-hidden="true" />
                  <span className="text-sm font-semibold text-brand-600">
                    {uploadingFoto ? "Mengunggah..." : "Ketuk untuk unggah foto"}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">JPG atau PNG, maks 2 MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    disabled={uploadingFoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {errors.foto && <p className="text-xs font-semibold text-alert-600">{errors.foto}</p>}
          </section>

          {/* Informasi Dasar Section */}
          <section className="space-y-3" aria-labelledby="basic-info">
            <h2 id="basic-info" className={sectionTitleClass}>
              Informasi Dasar
            </h2>
            <label className="block space-y-1.5">
              <span className={labelClass}>
                Nama Produk <span className="text-alert-600">*</span>
              </span>
              <input
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
                className={fieldClass}
              />
              {errors.nama_produk && (
                <p className="text-xs font-semibold text-alert-600">{errors.nama_produk}</p>
              )}
            </label>

            <div className="block space-y-1.5 relative">
              <span className={labelClass}>Kategori</span>
              <div className="relative">
                <input
                  type="text"
                  value={kategori}
                  onChange={(e) => {
                    setKategori(e.target.value);
                    setShowCategoryDropdown(true);
                  }}
                  onFocus={() => setShowCategoryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                  placeholder="Contoh: Kayu, Karet, Bola, Aksesoris"
                  className={fieldClass}
                />
                {showCategoryDropdown && filteredCategories.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-brand-200 rounded-2xl shadow-card max-h-48 overflow-y-auto z-50 py-1">
                    {filteredCategories.map((cat) => (
                      <li
                        key={cat}
                        onMouseDown={() => {
                          setKategori(cat);
                          setShowCategoryDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-brand-50 cursor-pointer text-sm font-medium text-brand-900 transition-colors"
                      >
                        {cat}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Harga Section */}
          <section className="space-y-3" aria-labelledby="price-info">
            <h2 id="price-info" className={sectionTitleClass}>
              Harga
            </h2>
            <label className="block space-y-1.5">
              <span className={labelClass}>Harga Jual</span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-700">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  value={harga}
                  onChange={(e) => {
                    setHarga(e.target.value);
                    if (errors.harga) {
                      const newErrors = { ...errors };
                      delete newErrors.harga;
                      setErrors(newErrors);
                    }
                  }}
                  placeholder="0"
                  className={`${fieldClass} pl-12`}
                  inputMode="numeric"
                />
              </span>
              {errors.harga && (
                <p className="text-xs font-semibold text-alert-600">{errors.harga}</p>
              )}
            </label>
          </section>

          {/* Varian & Stok Section */}
          <section className="space-y-3" aria-labelledby="variant-info">
            <div className="flex items-center justify-between gap-3">
              <h2 id="variant-info" className={sectionTitleClass}>
                Varian &amp; Stok
              </h2>
              <button
                type="button"
                onClick={addVarian}
                className="flex shrink-0 items-center gap-1 text-sm font-bold text-brand-600 transition-colors duration-150 ease-out hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
              >
                <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
                Tambah Varian
              </button>
            </div>

            <ul className="space-y-3">
              {varianList.map((variant, index) => (
                <li
                  key={index}
                  className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-brand-700">Varian {index + 1}</p>
                    {varianList.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Hapus varian ${index + 1}`}
                        onClick={() => removeVarian(index)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-alert-600 transition-colors duration-150 ease-out hover:bg-alert-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert-600 cursor-pointer"
                      >
                        <Trash2Icon className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    )}
                  </div>

                  <label className="block space-y-1.5">
                    <span className={labelClass}>
                      Nama Varian <span className="text-alert-600">*</span>
                    </span>
                    <input
                      type="text"
                      value={variant.nama_varian}
                      onChange={(e) => updateVarianField(index, "nama_varian", e.target.value)}
                      placeholder="Misal: Red / FL"
                      className={fieldClass}
                    />
                    {errors[`varian_${index}`] && (
                      <p className="text-xs font-semibold text-alert-600">
                        {errors[`varian_${index}`]}
                      </p>
                    )}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1.5">
                      <span className={labelClass}>Stok Awal</span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={variant.jumlah_stok}
                        onChange={(e) =>
                          updateVarianField(
                            index,
                            "jumlah_stok",
                            Math.max(0, parseInt(e.target.value, 10) || 0)
                          )
                        }
                        placeholder="0"
                        className={fieldClass}
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className={labelClass}>Min. Stok (ROP)</span>
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={variant.reorder_point}
                        onChange={(e) =>
                          updateVarianField(
                            index,
                            "reorder_point",
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                          )
                        }
                        placeholder="5"
                        className={fieldClass}
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <span className={labelClass}>Lokasi Barang Disimpan</span>
                    <input
                      type="text"
                      value={variant.lokasi_penyimpanan}
                      onChange={(e) =>
                        updateVarianField(index, "lokasi_penyimpanan", e.target.value)
                      }
                      placeholder="Contoh: Rak A1, Gudang B"
                      className={fieldClass}
                    />
                  </label>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={addVarian}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-white/70 px-4 py-3.5 text-sm font-bold text-brand-600 transition-colors duration-150 ease-out hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
            >
              <PlusIcon className="h-5 w-5" strokeWidth={2.4} />
              Tambah Varian Lain
            </button>
          </section>

          {errors.submit && (
            <div className="p-3 bg-alert-50 border border-alert-100 rounded-2xl">
              <p className="text-xs font-bold text-alert-700">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 border-t border-brand-200 pt-4">
            <button
              type="button"
              onClick={() => router.push("/produk")}
              className="flex-1 rounded-2xl border border-alert-200 bg-white px-4 py-3.5 text-sm font-bold text-alert-600 transition-colors duration-150 ease-out hover:bg-alert-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alert-600 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-[1.4] rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 px-4 py-3.5 text-sm font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
            >
              Simpan Produk
            </button>
          </div>
        </form>
      </main>

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
