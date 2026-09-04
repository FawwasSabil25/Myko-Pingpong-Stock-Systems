"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  FileUpIcon,
  MessageCircleIcon,
  MinusIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DetailHeader } from "@/components/DetailHeader";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";
import { platforms, shippingMethods } from "@/lib/orderFormOptions";

interface ProdukItem {
  id_produk: string;
  nama_produk: string;
  harga?: number | null;
  varian: {
    id_varian: string;
    nama_varian: string;
    jumlah_stok: number;
    reorder_point: number;
  }[];
}

interface ItemForm {
  id_produk: string;
  id_varian: string;
  jumlah: number;
}

const fieldClass =
  "w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-medium text-brand-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700";

const labelClass = "block text-xs font-bold text-brand-900";

const cardClass = "space-y-4 rounded-3xl border border-brand-200 bg-white p-5 shadow-card";

export default function InputPesananBaruPage() {
  const router = useRouter();
  const [produkList, setProdukList] = useState<ProdukItem[]>([]);
  const [loadingProduk, setLoadingProduk] = useState(true);

  // Form states
  const [platform, setPlatform] = useState("");
  const [noPesanan, setNoPesanan] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [metodePengiriman, setMetodePengiriman] = useState("");
  const [catatan, setCatatan] = useState("");
  const [resiFile, setResiFile] = useState<File | null>(null);
  const [resiUrl, setResiUrl] = useState<string | null>(null);
  const [uploadingResi, setUploadingResi] = useState(false);

  const [items, setItems] = useState<ItemForm[]>([
    { id_produk: "", id_varian: "", jumlah: 1 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendWA, setSendWA] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProduk();
  }, []);

  async function fetchProduk() {
    setLoadingProduk(true);
    const { data, error } = await supabase
      .from("produk")
      .select("id_produk, nama_produk, harga, varian(id_varian, nama_varian, jumlah_stok, reorder_point)")
      .order("nama_produk", { ascending: true });

    if (error) {
      console.error("Error fetching produk:", error);
    } else {
      setProdukList((data as any[]) || []);
    }
    setLoadingProduk(false);
  }

  async function handleResiUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResiFile(file);
      setUploadingResi(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/pesanan/upload-resi", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Gagal mengunggah file resi.");
        }

        const data = await res.json();
        setResiUrl(data.publicUrl);
      } catch (err: any) {
        console.error("Error uploading resi PDF:", err);
        setErrors({ ...errors, resi: err.message || "Gagal mengunggah file resi." });
      } finally {
        setUploadingResi(false);
      }
    }
  }

  function addItem() {
    setItems([...items, { id_produk: "", id_varian: "", jumlah: 1 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ItemForm, value: any) {
    const updated = [...items];
    if (field === "id_produk") {
      updated[index].id_produk = value;
      const selectedProd = produkList.find((p) => p.id_produk === value);
      updated[index].id_varian = selectedProd?.varian[0]?.id_varian || "";
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!platform) {
      newErrors.platform = "Platform wajib dipilih.";
    }

    if (!namaPelanggan.trim()) {
      newErrors.nama_pelanggan = "Nama pelanggan wajib diisi.";
    }

    if (!metodePengiriman) {
      newErrors.metode_pengiriman = "Metode pengiriman wajib dipilih.";
    }

    items.forEach((item, i) => {
      if (!item.id_produk || !item.id_varian) {
        newErrors[`item_${i}`] = "Produk & Varian wajib dipilih.";
      }
      if (item.jumlah <= 0) {
        newErrors[`item_${i}_qty`] = "Jumlah item harus minimal 1.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(withWA: boolean) {
    setSendWA(withWA);
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function confirmSubmit() {
    setSubmitting(true);

    try {
      const payload = {
        platform,
        no_pesanan: noPesanan.trim() || null,
        nama_pelanggan: namaPelanggan.trim(),
        metode_pengiriman: metodePengiriman,
        catatan: catatan.trim() || null,
        resi_url: resiUrl,
        items: items.map((i) => ({
          id_varian: i.id_varian,
          jumlah: i.jumlah,
        })),
        kirim_wa: sendWA,
      };

      const res = await fetch("/api/pesanan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal membuat pesanan.");
      }

      setSubmitting(false);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error submitting order:", err);
      setSubmitting(false);
      setShowConfirm(false);
      setErrors({ submit: err.message || "Gagal memproses data pesanan." });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <DetailHeader title="Input Pesanan Baru" backTo="/pemilik/pesanan" />

      <main className="px-5 pb-24 pt-6 max-w-md mx-auto">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(true);
          }}
        >
          {/* Informasi Pesanan */}
          <section className={cardClass} aria-labelledby="order-info">
            <h2 id="order-info" className="text-lg font-extrabold tracking-tight text-brand-900">
              Informasi Pesanan
            </h2>

            <label className="block space-y-1.5">
              <span className={labelClass}>
                Platform / Sumber <span className="text-alert-600">*</span>
              </span>
              <span className="relative block">
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className={`${fieldClass} appearance-none pr-11`}
                >
                  <option value="" disabled>
                    Pilih Platform...
                  </option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600"
                  aria-hidden="true"
                />
              </span>
              {errors.platform && (
                <p className="text-xs font-semibold text-alert-600">{errors.platform}</p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className={labelClass}>No. Pesanan / Invoice (Opsional)</span>
              <input
                type="text"
                value={noPesanan}
                onChange={(e) => setNoPesanan(e.target.value)}
                placeholder="Cth: INV/2026/001"
                className={fieldClass}
              />
            </label>

            <label className="block space-y-1.5">
              <span className={labelClass}>
                Nama Pelanggan <span className="text-alert-600">*</span>
              </span>
              <input
                type="text"
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                placeholder="Nama lengkap pembeli"
                className={fieldClass}
              />
              {errors.nama_pelanggan && (
                <p className="text-xs font-semibold text-alert-600">{errors.nama_pelanggan}</p>
              )}
            </label>
          </section>

          {/* Item Pesanan */}
          <section className={cardClass} aria-labelledby="order-items">
            <div className="flex items-center justify-between gap-3">
              <h2 id="order-items" className="text-lg font-extrabold tracking-tight text-brand-900">
                Item Pesanan
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-800 cursor-pointer"
              >
                <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
                Tambah Item
              </button>
            </div>

            {loadingProduk ? (
              <p className="text-xs font-semibold text-slate-500 py-4 text-center">Memuat daftar produk...</p>
            ) : (
              <ul className="space-y-3">
                {items.map((item, index) => {
                  const selectedProd = produkList.find((p) => p.id_produk === item.id_produk);
                  const availableVariants = selectedProd?.varian || [];

                  return (
                    <li
                      key={index}
                      className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-brand-700">Item {index + 1}</p>
                        {items.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Hapus item ${index + 1}`}
                            onClick={() => removeItem(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-alert-600 transition-colors duration-150 ease-out hover:bg-alert-50 cursor-pointer"
                          >
                            <Trash2Icon className="h-4 w-4" strokeWidth={2.2} />
                          </button>
                        )}
                      </div>

                      <label className="block space-y-1.5">
                        <span className={labelClass}>Produk</span>
                        <span className="relative block">
                          <select
                            value={item.id_produk}
                            onChange={(e) => updateItem(index, "id_produk", e.target.value)}
                            className={`${fieldClass} appearance-none pr-11`}
                          >
                            <option value="" disabled>
                              Pilih Produk...
                            </option>
                            {produkList.map((p) => (
                              <option key={p.id_produk} value={p.id_produk}>
                                {p.nama_produk}
                              </option>
                            ))}
                          </select>
                          <ChevronDownIcon
                            className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600"
                            aria-hidden="true"
                          />
                        </span>
                      </label>

                      {item.id_produk && (
                        <label className="block space-y-1.5">
                          <span className={labelClass}>Varian</span>
                          <span className="relative block">
                            <select
                              value={item.id_varian}
                              onChange={(e) => updateItem(index, "id_varian", e.target.value)}
                              className={`${fieldClass} appearance-none pr-11`}
                            >
                              <option value="" disabled>
                                Pilih Varian...
                              </option>
                              {availableVariants.map((v) => (
                                <option key={v.id_varian} value={v.id_varian}>
                                  {v.nama_varian} (Stok: {v.jumlah_stok})
                                </option>
                              ))}
                            </select>
                            <ChevronDownIcon
                              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600"
                              aria-hidden="true"
                            />
                          </span>
                        </label>
                      )}

                      <div className="space-y-1.5">
                        <span className={labelClass}>Jumlah (Qty)</span>
                        <div className="flex items-center justify-between rounded-2xl border border-brand-200 bg-white px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(index, "jumlah", Math.max(1, item.jumlah - 1))
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-700 hover:bg-brand-50 cursor-pointer"
                          >
                            <MinusIcon className="h-4 w-4" strokeWidth={2.6} />
                          </button>
                          <span className="text-base font-extrabold text-brand-900">{item.jumlah}</span>
                          <button
                            type="button"
                            onClick={() => updateItem(index, "jumlah", item.jumlah + 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-700 hover:bg-brand-50 cursor-pointer"
                          >
                            <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>

                      {errors[`item_${index}`] && (
                        <p className="text-xs font-semibold text-alert-600">{errors[`item_${index}`]}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              onClick={addItem}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-300 bg-white px-4 py-3.5 text-sm font-bold text-brand-600 hover:bg-brand-50 cursor-pointer"
            >
              <PlusIcon className="h-5 w-5" strokeWidth={2.4} />
              Tambah Item Lain
            </button>
          </section>

          {/* Pengiriman & File Resi */}
          <section className={cardClass} aria-labelledby="shipping-info">
            <h2 id="shipping-info" className="text-lg font-extrabold tracking-tight text-brand-900">
              Pengiriman &amp; Resi
            </h2>

            <label className="block space-y-1.5">
              <span className={labelClass}>
                Metode Pengiriman <span className="text-alert-600">*</span>
              </span>
              <span className="relative block">
                <select
                  value={metodePengiriman}
                  onChange={(e) => setMetodePengiriman(e.target.value)}
                  className={`${fieldClass} appearance-none pr-11`}
                >
                  <option value="" disabled>
                    Pilih Metode...
                  </option>
                  {shippingMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600"
                  aria-hidden="true"
                />
              </span>
              {errors.metode_pengiriman && (
                <p className="text-xs font-semibold text-alert-600">{errors.metode_pengiriman}</p>
              )}
            </label>

            <div className="space-y-1.5">
              <span className={labelClass}>Resi Pesanan (PDF / Foto)</span>
              <div className="relative flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-6 transition-colors duration-150 ease-out hover:bg-white">
                {resiUrl ? (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-xs font-bold text-brand-700">Resi ter-upload!</span>
                    <a
                      href={resiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-brand-600 underline"
                    >
                      Buka File Resi
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setResiFile(null);
                        setResiUrl(null);
                      }}
                      className="text-xs font-bold text-alert-600 hover:underline mt-1"
                    >
                      Ganti Resi
                    </button>
                  </div>
                ) : (
                  <label className="flex w-full flex-col items-center justify-center gap-1.5 cursor-pointer">
                    <FileUpIcon className="h-7 w-7 text-brand-600" strokeWidth={1.8} aria-hidden="true" />
                    <span className="text-sm font-semibold text-brand-700">
                      {uploadingResi ? "Mengunggah file..." : "Klik untuk upload file resi"}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">PDF atau Gambar, maks 2 MB</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleResiUpload}
                      disabled={uploadingResi}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {errors.resi && <p className="text-xs font-semibold text-alert-600">{errors.resi}</p>}
            </div>

            <label className="block space-y-1.5">
              <span className={labelClass}>Catatan Pesanan (Opsional)</span>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan khusus pesanan..."
                className={`${fieldClass} resize-none`}
              />
            </label>
          </section>

          {errors.submit && (
            <div className="p-3 bg-alert-50 border border-alert-100 rounded-2xl">
              <p className="text-xs font-bold text-alert-700">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-wa-500 px-5 py-4 text-base font-bold text-white shadow-lift transition-colors duration-150 ease-out hover:bg-wa-600 cursor-pointer"
            >
              <MessageCircleIcon className="h-5 w-5" strokeWidth={2.2} />
              Simpan &amp; Kirim Notifikasi WA
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full rounded-2xl border border-brand-300 bg-white px-5 py-4 text-base font-bold text-brand-700 transition-colors duration-150 ease-out hover:bg-brand-50 cursor-pointer"
            >
              Simpan Saja (Tanpa WA)
            </button>
          </div>
        </form>
      </main>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmSubmit}
        title="Simpan Pesanan Baru?"
        message={`Pesanan untuk ${namaPelanggan} akan disimpan${sendWA ? " dan notifikasi WA akan dikirim ke Pengelola" : ""}. Lanjutkan?`}
        confirmLabel="Simpan"
        cancelLabel="Batal"
        loading={submitting}
      />

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccess}
        onClose={() => router.push("/pemilik/pesanan")}
        title="Pesanan Berhasil Disimpan!"
        message={`Pesanan untuk ${namaPelanggan} telah berhasil dicatat.`}
        buttonLabel="Kembali ke Daftar Pesanan"
      />
    </div>
  );
}
