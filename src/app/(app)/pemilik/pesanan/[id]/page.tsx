"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  FileUpIcon,
  MinusIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getRole } from "@/lib/role";
import { MobileShell } from "@/components/MobileShell";
import { DetailHeader } from "@/components/DetailHeader";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";
import { platforms, shippingMethods } from "@/lib/orderFormOptions";

interface Varian {
  id_varian: string;
  nama_varian: string;
  jumlah_stok: number;
}

interface Produk {
  id_produk: string;
  nama_produk: string;
  varian: Varian[];
}

interface ItemInput {
  id_produk: string;
  id_varian: string;
  jumlah: number;
}

const fieldClass =
  "w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-medium text-brand-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700";

const labelClass = "block text-xs font-bold text-brand-900";

const cardClass = "space-y-4 rounded-3xl border border-brand-200 bg-white p-5 shadow-card";

export default function DetailPesananPemilikPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // States for database data
  const [products, setProducts] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [platform, setPlatform] = useState("");
  const [noPesanan, setNoPesanan] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [items, setItems] = useState<ItemInput[]>([]);
  const [metodePengiriman, setMetodePengiriman] = useState("");
  const [catatan, setCatatan] = useState("");
  const [currentResiUrl, setCurrentResiUrl] = useState<string | null>(null);
  const [uploadingResi, setUploadingResi] = useState(false);

  // Order status for locking
  const [orderStatus, setOrderStatus] = useState<string>("baru");
  const isLocked = orderStatus === "dikirim" || orderStatus === "selesai";

  // Modal & Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Delete states
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

const initData = useCallback(async () => {
    try {
      const { data: prodData, error: prodErr } = await supabase
        .from("produk")
        .select("id_produk, nama_produk, varian(id_varian, nama_varian, jumlah_stok)");

      if (prodErr) throw prodErr;
      setProducts((prodData as Array<Produk>) || []);

      const res = await fetch(`/api/pesanan/${id}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data pesanan.");
      }
      const order = await res.json();

      setOrderStatus(order.status || "baru");
      setPlatform(order.platform || "");
      setNoPesanan(order.no_pesanan || "");
      setNamaPelanggan(order.nama_pelanggan || "");
      setMetodePengiriman(order.metode_pengiriman || "");
      setCatatan(order.catatan || "");
      setCurrentResiUrl(order.resi_url || null);

      const mappedItems = order.detail_pesanan.map((d: {
        varian: { produk: { id_produk: string } };
        id_varian: string;
        jumlah: number;
      }) => ({
        id_produk: d.varian.produk.id_produk,
        id_varian: d.id_varian,
        jumlah: d.jumlah,
      }));
      setItems(mappedItems);

    } catch (err: unknown) {
      console.error("Error loading order page data:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }
    initData();
  }, [router, id, initData]);

  function handleAddItem() {
    setItems([...items, { id_produk: "", id_varian: "", jumlah: 1 }]);
  }

  function handleRemoveItem(index: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof ItemInput, value: any) {
    const updated = [...items];
    if (field === "id_produk") {
      updated[index] = { id_produk: value, id_varian: "", jumlah: 1 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  }

  async function handleResiUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
        setCurrentResiUrl(data.publicUrl);
      } catch (err: unknown) {
        console.error("Error uploading resi:", err);
        setErrors({ ...errors, resi: err instanceof Error ? err.message : "Gagal mengunggah file resi." });
      } finally {
        setUploadingResi(false);
      }
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!platform) newErrors.platform = "Platform wajib dipilih.";
    if (!namaPelanggan.trim()) newErrors.nama_pelanggan = "Nama pelanggan wajib diisi.";
    if (!metodePengiriman) newErrors.metode_pengiriman = "Metode pengiriman wajib dipilih.";

    items.forEach((item, index) => {
      if (!item.id_produk || !item.id_varian) {
        newErrors[`item_${index}`] = "Produk & Varian wajib dipilih.";
      }
      if (item.jumlah <= 0) {
        newErrors[`item_${index}_qty`] = "Jumlah item harus minimal 1.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSimpan() {
    if (!validate()) return;
    setShowConfirm(true);
  }

  async function handleConfirmSave() {
    setSaving(true);
    try {
      const payload = {
        platform,
        no_pesanan: noPesanan.trim() || null,
        nama_pelanggan: namaPelanggan.trim(),
        metode_pengiriman: metodePengiriman,
        catatan: catatan.trim() || null,
        resi_url: currentResiUrl,
        items: items.map((it) => ({
          id_varian: it.id_varian,
          jumlah: it.jumlah,
        })),
      };

      const res = await fetch(`/api/pesanan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memperbarui pesanan.");
      }

      setSaving(false);
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err: unknown) {
      console.error("Error updating order:", err);
      setSaving(false);
      setShowConfirm(false);
      setErrors({ submit: err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan." });
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pesanan/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menghapus pesanan.");
      }
      setDeleting(false);
      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (err: unknown) {
      console.error("Error deleting order:", err);
      setDeleting(false);
      setShowDeleteConfirm(false);
      setErrors({ submit: err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus." });
    }
  }

  if (loading) {
    return (
      <MobileShell header={<DetailHeader title="Detail Pesanan" backTo="/pemilik/pesanan" />}>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell header={<DetailHeader title={isLocked ? "Detail Pesanan" : "Ubah Pesanan"} backTo="/pemilik/pesanan" />}>
      <main className="px-5 pb-24 pt-6 max-w-md mx-auto">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSimpan();
          }}
        >
          {/* Header Status Card */}
          <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-white via-white to-brand-100 p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                #ORD-{id.slice(0, 8).toUpperCase()}
              </p>
              <h2 className="text-xl font-extrabold text-brand-900 mt-0.5">
                {isLocked ? "Pesanan Dikirim" : "Pesanan Masuk"}
              </h2>
            </div>
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-bold",
                isLocked
                  ? "bg-gradient-to-r from-positive-50 to-brand-100 text-positive-600"
                  : "bg-gradient-to-r from-warn-50 to-warn-100 text-warn-700",
              ].join(" ")}
            >
              {isLocked ? "Dikirim" : "Baru"}
            </span>
          </section>

          <fieldset disabled={isLocked} className="space-y-5">
            {/* Informasi Pesanan */}
            <section className={cardClass}>
              <h2 className="text-lg font-extrabold tracking-tight text-brand-900">
                Informasi Pesanan
              </h2>

              <label className="block space-y-1.5">
                <span className={labelClass}>Platform / Sumber</span>
                <span className="relative block">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className={`${fieldClass} appearance-none pr-11`}
                  >
                    <option value="" disabled>Pilih Platform...</option>
                    {platforms.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className={labelClass}>No. Pesanan / Invoice</span>
                <input
                  type="text"
                  value={noPesanan}
                  onChange={(e) => setNoPesanan(e.target.value)}
                  placeholder="Cth: INV/2026/001"
                  className={fieldClass}
                />
              </label>

              <label className="block space-y-1.5">
                <span className={labelClass}>Nama Pelanggan</span>
                <input
                  type="text"
                  value={namaPelanggan}
                  onChange={(e) => setNamaPelanggan(e.target.value)}
                  placeholder="Nama pembeli"
                  className={fieldClass}
                />
              </label>
            </section>

            {/* Item Pesanan */}
            <section className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold tracking-tight text-brand-900">
                  Item Pesanan
                </h2>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-800 cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
                    Tambah Item
                  </button>
                )}
              </div>

              <ul className="space-y-3">
                {items.map((item, index) => {
                  const selectedProd = products.find((p) => p.id_produk === item.id_produk);
                  const availableVariants = selectedProd?.varian || [];

                  return (
                    <li key={index} className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-brand-700">Item {index + 1}</p>
                        {!isLocked && items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-alert-600 hover:bg-alert-50 cursor-pointer"
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
                            <option value="" disabled>Pilih Produk...</option>
                            {products.map((p) => (
                              <option key={p.id_produk} value={p.id_produk}>{p.nama_produk}</option>
                            ))}
                          </select>
                          <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
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
                              <option value="" disabled>Pilih Varian...</option>
                              {availableVariants.map((v) => (
                                <option key={v.id_varian} value={v.id_varian}>
                                  {v.nama_varian} (Stok: {v.jumlah_stok})
                                </option>
                              ))}
                            </select>
                            <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
                          </span>
                        </label>
                      )}

                      <div className="space-y-1.5">
                        <span className={labelClass}>Jumlah (Qty)</span>
                        <div className="flex items-center justify-between rounded-2xl border border-brand-200 bg-white px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => updateItem(index, "jumlah", Math.max(1, item.jumlah - 1))}
                            disabled={isLocked}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-700 hover:bg-brand-50 cursor-pointer disabled:opacity-40"
                          >
                            <MinusIcon className="h-4 w-4" strokeWidth={2.6} />
                          </button>
                          <span className="text-base font-extrabold text-brand-900">{item.jumlah}</span>
                          <button
                            type="button"
                            onClick={() => updateItem(index, "jumlah", item.jumlah + 1)}
                            disabled={isLocked}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-700 hover:bg-brand-50 cursor-pointer disabled:opacity-40"
                          >
                            <PlusIcon className="h-4 w-4" strokeWidth={2.6} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Pengiriman & Resi */}
            <section className={cardClass}>
              <h2 className="text-lg font-extrabold tracking-tight text-brand-900">
                Pengiriman & Resi
              </h2>

              <label className="block space-y-1.5">
                <span className={labelClass}>Metode Pengiriman</span>
                <span className="relative block">
                  <select
                    value={metodePengiriman}
                    onChange={(e) => setMetodePengiriman(e.target.value)}
                    className={`${fieldClass} appearance-none pr-11`}
                  >
                    <option value="" disabled>Pilih Metode...</option>
                    {shippingMethods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
                </span>
              </label>

              <div className="space-y-1.5">
                <span className={labelClass}>Resi Pesanan (PDF)</span>
                <div className="relative flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-6 transition-colors duration-150 ease-out">
                  {currentResiUrl ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="text-xs font-bold text-brand-700">File Resi Tersimpan</span>
                      <a href={currentResiUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand-600 underline">
                        Buka File Resi PDF
                      </a>
                      {!isLocked && (
                        <label className="mt-2 rounded-xl border border-brand-300 bg-white px-4 py-2 text-xs font-bold text-brand-600 cursor-pointer hover:bg-brand-50">
                          Ganti File Resi
                          <input type="file" accept=".pdf,image/*" onChange={handleResiUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  ) : (
                    <label className="flex w-full flex-col items-center justify-center gap-1.5 cursor-pointer">
                      <FileUpIcon className="h-7 w-7 text-brand-600" strokeWidth={1.8} />
                      <span className="text-sm font-semibold text-brand-700">
                        {uploadingResi ? "Mengunggah..." : "Upload file resi"}
                      </span>
                      <input type="file" accept=".pdf,image/*" onChange={handleResiUpload} disabled={isLocked || uploadingResi} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className={labelClass}>Catatan Pesanan</span>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan khusus pesanan..."
                  className={`${fieldClass} resize-none`}
                />
              </label>
            </section>
          </fieldset>

          {errors.submit && (
            <div className="p-3 bg-alert-50 border border-alert-100 rounded-2xl">
              <p className="text-xs font-bold text-alert-700">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {!isLocked ? (
              <>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 px-5 py-4 text-base font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-alert-200 bg-gradient-to-b from-white to-alert-50 px-5 py-4 text-base font-bold text-alert-600 shadow-card transition-colors duration-150 ease-out hover:to-alert-100 cursor-pointer"
                >
                  <Trash2Icon className="h-5 w-5" strokeWidth={2.2} />
                  Hapus Pesanan
                </button>
              </>
            ) : (
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl text-center">
                <p className="text-xs font-bold text-brand-700">
                  Pesanan sudah dikirim — data terkunci.
                </p>
              </div>
            )}
          </div>
        </form>
      </main>

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Simpan Perubahan Pesanan?"
        message="Pastikan data pesanan yang Anda perbarui sudah benar."
        confirmLabel="Simpan"
        cancelLabel="Batal"
        loading={saving}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pesanan?"
        message="Apakah Anda yakin ingin menghapus pesanan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={deleting}
      />

      <SuccessDialog
        open={showSuccess}
        onClose={() => router.push("/pemilik/pesanan")}
        title="Pesanan Berhasil Diperbarui!"
        message="Perubahan informasi pesanan telah disimpan ke sistem."
        buttonLabel="Kembali ke Daftar Pesanan"
      />

      <SuccessDialog
        open={showDeleteSuccess}
        onClose={() => router.push("/pemilik/pesanan")}
        title="Pesanan Berhasil Dihapus!"
        message="Data pesanan telah dihapus dari sistem."
        buttonLabel="Kembali ke Daftar Pesanan"
      />
    </MobileShell>
  );
}