"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getRole } from "@/lib/role";
import TopAppBar from "@/components/TopAppBar";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

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
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [platform, setPlatform] = useState("");
  const [noPesanan, setNoPesanan] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [items, setItems] = useState<ItemInput[]>([]);
  const [metodePengiriman, setMetodePengiriman] = useState("");
  const [metodeLainnya, setMetodeLainnya] = useState("");
  const [catatan, setCatatan] = useState("");
  const [currentResiUrl, setCurrentResiUrl] = useState<string | null>(null);
  const [resiFile, setResiFile] = useState<File | null>(null);

  // Order status for locking
  const [orderStatus, setOrderStatus] = useState<string>("baru");
  const isLocked = orderStatus === "dikirim";

  // Modal & Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Delete states (UC-03c)
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  useEffect(() => {
    // Pastikan hanya Pemilik yang bisa mengakses halaman ini
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }

    initData();
  }, [router, id]);

  async function initData() {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all products to populate dropdowns
      const { data: prodData, error: prodErr } = await supabase
        .from("produk")
        .select("id_produk, nama_produk, varian(id_varian, nama_varian, jumlah_stok)");

      if (prodErr) throw prodErr;
      setProducts((prodData as any[]) || []);

      // 2. Fetch current order details
      const res = await fetch(`/api/pesanan/${id}`);
      if (!res.ok) {
        throw new Error("Gagal mengambil data pesanan.");
      }
      const order = await res.json();

      setOrderStatus(order.status || "baru");
      setPlatform(order.platform || "");
      setNoPesanan(order.no_pesanan || "");
      setNamaPelanggan(order.nama_pelanggan || "");
      setCatatan(order.catatan || "");
      setCurrentResiUrl(order.resi_url || null);

      // Determine shipping method dropdown values
      const deliveryMethods = [
        "Diserahkan ke JNE",
        "Diserahkan ke JNT",
        "Dijemput Kurir",
      ];
      if (order.metode_pengiriman) {
        if (deliveryMethods.includes(order.metode_pengiriman)) {
          setMetodePengiriman(order.metode_pengiriman);
        } else {
          setMetodePengiriman("Lainnya");
          setMetodeLainnya(order.metode_pengiriman);
        }
      }

      // Map detail_pesanan to state
      const mappedItems = order.detail_pesanan.map((d: any) => ({
        id_produk: d.varian.produk.id_produk,
        id_varian: d.id_varian,
        jumlah: d.jumlah,
      }));
      setItems(mappedItems);

    } catch (err: any) {
      console.error("Error loading order page data:", err);
      setError(err.message || "Gagal mengambil data pendukung.");
    } finally {
      setLoading(false);
    }
  }

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

    // Clear validation error
    const newErrors = { ...errors };
    delete newErrors[`item_${index}`];
    delete newErrors[`item_${index}_qty`];
    setErrors(newErrors);
  }

  function incrementQty(index: number) {
    updateItem(index, "jumlah", items[index].jumlah + 1);
  }

  function decrementQty(index: number) {
    if (items[index].jumlah > 1) {
      updateItem(index, "jumlah", items[index].jumlah - 1);
    }
  }

  function getAvailableStock(id_produk: string, id_varian: string) {
    const p = products.find((prod) => prod.id_produk === id_produk);
    const v = p?.varian.find((varItem) => varItem.id_varian === id_varian);
    return v ? v.jumlah_stok : 0;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!platform) newErrors.platform = "Platform wajib dipilih.";
    if (!metodePengiriman) newErrors.metodePengiriman = "Metode pengiriman wajib dipilih.";
    if (metodePengiriman === "Lainnya" && !metodeLainnya.trim()) {
      newErrors.metodeLainnya = "Metode pengiriman lainnya wajib diisi.";
    }

    items.forEach((item, index) => {
      if (!item.id_produk) {
        newErrors[`item_${index}`] = "Produk wajib dipilih.";
      } else if (!item.id_varian) {
        newErrors[`item_${index}`] = "Varian wajib dipilih.";
      } else {
        const available = getAvailableStock(item.id_produk, item.id_varian);
        if (item.jumlah > available) {
          newErrors[`item_${index}_qty`] = `Stok tidak mencukupi (Tersedia: ${available} pcs).`;
        }
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
      let finalResiUrl = currentResiUrl;

      // 1. Upload new resi if selected
      if (resiFile) {
        const formData = new FormData();
        formData.append("file", resiFile);

        const uploadRes = await fetch("/api/pesanan/upload-resi", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Gagal mengunggah file resi.");
        }

        const uploadData = await uploadRes.json();
        finalResiUrl = uploadData.url;
      }

      // 2. Perform PATCH request to save changes
      const payload = {
        platform,
        no_pesanan: noPesanan.trim() || null,
        nama_pelanggan: namaPelanggan.trim() !== "" ? namaPelanggan.trim() : null,
        metode_pengiriman:
          metodePengiriman === "Lainnya" ? metodeLainnya.trim() : metodePengiriman,
        catatan: catatan.trim() || null,
        resi_url: finalResiUrl,
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
    } catch (err: any) {
      console.error("Error updating order:", err);
      setSaving(false);
      setShowConfirm(false);
      setErrors({ submit: err.message || "Terjadi kesalahan saat menyimpan." });
    }
  }

  // Delete handler (UC-03c)
  function handleDelete() {
    setShowDeleteConfirm(true);
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
    } catch (err: any) {
      console.error("Error deleting order:", err);
      setDeleting(false);
      setShowDeleteConfirm(false);
      setErrors({ submit: err.message || "Terjadi kesalahan saat menghapus." });
    }
  }

  const pageTitle = isLocked ? "Detail Pesanan" : "Ubah Pesanan";

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7F9FB]">
        <TopAppBar title={pageTitle} backHref="/pemilik/pesanan" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7F9FB]">
        <TopAppBar title="Ubah Pesanan" backHref="/pemilik/pesanan" />
        <div className="flex-1 px-6 py-10 text-center flex flex-col gap-3 justify-center items-center">
          <p className="text-red-500 font-bold">{error}</p>
          <button
            onClick={initData}
            className="px-4 py-2 bg-[#00647C] text-white text-xs font-semibold rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <TopAppBar title={pageTitle} backHref="/pemilik/pesanan" />

      {/* Main content scrollable container */}
      <div className="flex-1 px-6 py-6 pb-[180px]">
        <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
          {/* Section 1: Informasi Pesanan (Read-only reference) */}
          <section className="flex flex-col gap-3 bg-white p-5 border border-[#F2F4F6] rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-[#00647C]">
              ID: #ORD-{id.slice(0, 8).toUpperCase()}
            </span>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#191C1E] leading-8">
                Status: {isLocked ? "Pesanan Dikirim" : "Pesanan Masuk"}
              </h2>
              <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${isLocked ? "bg-green-100 text-green-700" : "bg-[#DAE2FD] text-[#5C647A]"}`}>
                {isLocked ? "Sudah Dikirim" : "Menunggu Konfirmasi"}
              </span>
            </div>
          </section>

          <fieldset disabled={isLocked} className="contents">

          {/* Section 2: Informasi Dasar & Platform */}
          <section className="flex flex-col gap-4 bg-white p-5 border border-[#F2F4F6] rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-[#191C1E] border-b border-[#F1F5F9] pb-2">
              Informasi Sumber
            </h2>

            {/* Platform Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#3E484D]">
                Platform/Sumber <span className="text-red-500">*</span>
              </label>
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  if (errors.platform) {
                    const errs = { ...errors };
                    delete errs.platform;
                    setErrors(errs);
                  }
                }}
                className={`w-full h-12 px-4 bg-white border rounded-lg outline-none focus:border-[#00647C] ${
                  errors.platform ? "border-red-400 focus:border-red-500" : "border-[#BDC8CE]"
                }`}
              >
                <option value="">Pilih Platform...</option>
                <option value="Shopee">Shopee</option>
                <option value="Tokopedia">Tokopedia</option>
              </select>
              {errors.platform && <p className="text-xs text-red-500">{errors.platform}</p>}
            </div>

            {/* No Pesanan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#3E484D]">
                No. Pesanan
              </label>
              <input
                type="text"
                value={noPesanan}
                onChange={(e) => setNoPesanan(e.target.value)}
                placeholder="Contoh: 240618ABCDEF"
                className="w-full h-12 px-4 bg-white border border-[#BDC8CE] rounded-lg outline-none focus:border-[#00647C]"
              />
            </div>
          </section>

          {/* Section 3: Item Pesanan */}
          <section className="flex flex-col gap-4 bg-white p-5 border border-[#F2F4F6] rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <h2 className="text-lg font-bold text-[#191C1E]">
                Item Pesanan
              </h2>
              <span className="text-xs text-[#6E797E]">Min. 1 Item</span>
            </div>

            <div className="flex flex-col gap-4">
              {items.map((item, index) => {
                const prod = products.find((p) => p.id_produk === item.id_produk);
                const varianList = prod?.varian || [];

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-[#BDC8CE] flex flex-col gap-3 relative bg-[#F7F9FB]"
                  >
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Hapus Item"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    )}

                    <span className="text-xs font-bold text-[#6E797E]">
                      Item {index + 1}
                    </span>

                    {/* Product Selection */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#3E484D]">
                        Pilih Produk <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.id_produk}
                        onChange={(e) => updateItem(index, "id_produk", e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-[#BDC8CE] rounded-lg outline-none focus:border-[#00647C] text-sm"
                      >
                        <option value="">Pilih Produk...</option>
                        {products.map((p) => (
                          <option key={p.id_produk} value={p.id_produk}>
                            {p.nama_produk}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Varian Selection */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#3E484D]">
                        Pilih Varian <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.id_varian}
                        onChange={(e) => updateItem(index, "id_varian", e.target.value)}
                        disabled={!item.id_produk}
                        className="w-full h-10 px-3 bg-white border border-[#BDC8CE] rounded-lg outline-none focus:border-[#00647C] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Pilih Varian...</option>
                        {varianList.map((v) => (
                          <option key={v.id_varian} value={v.id_varian}>
                            {v.nama_varian} (Stok: {v.jumlah_stok} pcs)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-[#3E484D]">
                        Jumlah (pcs)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => decrementQty(index)}
                          disabled={item.jumlah <= 1 || !item.id_varian}
                          className="w-8 h-8 rounded border border-[#BDC8CE] flex items-center justify-center font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.jumlah}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateItem(
                              index,
                              "jumlah",
                              isNaN(val) ? 1 : Math.max(1, val)
                            );
                          }}
                          disabled={!item.id_varian}
                          className="w-16 h-8 border border-[#BDC8CE] rounded text-center text-sm font-semibold focus:border-[#00647C] outline-none disabled:bg-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => incrementQty(index)}
                          disabled={!item.id_varian}
                          className="w-8 h-8 rounded border border-[#BDC8CE] flex items-center justify-center font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {errors[`item_${index}`] && (
                      <p className="text-xs text-red-500 font-semibold">{errors[`item_${index}`]}</p>
                    )}
                    {errors[`item_${index}_qty`] && (
                      <p className="text-xs text-red-500 font-semibold">{errors[`item_${index}_qty`]}</p>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full h-11 border-2 border-dashed border-[#BDC8CE] text-[#6E797E] hover:border-[#00647C] hover:text-[#00647C] transition-colors rounded-xl text-sm font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                + Tambah Item Pesanan
              </button>
            </div>
          </section>

          {/* Section 4: Informasi Pelanggan */}
          <section className="flex flex-col gap-4 bg-white p-5 border border-[#F2F4F6] rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-[#191C1E] border-b border-[#F1F5F9] pb-2">
              Informasi Pelanggan
            </h2>

            {/* Nama Pelanggan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#3E484D]">
                Nama Lengkap (Opsional)
              </label>
              <input
                type="text"
                value={namaPelanggan}
                onChange={(e) => {
                  setNamaPelanggan(e.target.value);
                  if (errors.namaPelanggan) {
                    const errs = { ...errors };
                    delete errs.namaPelanggan;
                    setErrors(errs);
                  }
                }}
                placeholder="Contoh: Budi Santoso (opsional)"
                className="w-full h-12 px-4 bg-white border border-[#BDC8CE] rounded-lg outline-none focus:border-[#00647C]"
              />
            </div>
          </section>

          {/* Section 5: Metode Pengiriman */}
          <section className="flex flex-col gap-4 bg-white p-5 border border-[#F2F4F6] rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-[#191C1E] border-b border-[#F1F5F9] pb-2">
              Metode Pengiriman
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#3E484D]">
                Metode Pengiriman <span className="text-red-500">*</span>
              </label>
              <select
                value={metodePengiriman}
                onChange={(e) => {
                  setMetodePengiriman(e.target.value);
                  if (errors.metodePengiriman) {
                    const errs = { ...errors };
                    delete errs.metodePengiriman;
                    setErrors(errs);
                  }
                }}
                className={`w-full h-12 px-4 bg-white border rounded-lg outline-none focus:border-[#00647C] ${
                  errors.metodePengiriman ? "border-red-400 focus:border-red-500" : "border-[#BDC8CE]"
                }`}
              >
                <option value="">Pilih Metode...</option>
                <option value="Diserahkan ke JNE">Diserahkan ke JNE</option>
                <option value="Diserahkan ke JNT">Diserahkan ke JNT</option>
                <option value="Dijemput Kurir">Dijemput Kurir</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              {errors.metodePengiriman && <p className="text-xs text-red-500">{errors.metodePengiriman}</p>}
            </div>

            {/* Custom Input for "Lainnya" */}
            {metodePengiriman === "Lainnya" && (
              <div className="flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-sm font-semibold text-[#3E484D]">
                  Nama Ekspedisi/Kurir Lainnya <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={metodeLainnya}
                  onChange={(e) => {
                    setMetodeLainnya(e.target.value);
                    if (errors.metodeLainnya) {
                      const errs = { ...errors };
                      delete errs.metodeLainnya;
                      setErrors(errs);
                    }
                  }}
                  placeholder="Contoh: Diserahkan ke Sicepat"
                  className={`w-full h-12 px-4 bg-white border rounded-lg outline-none focus:border-[#00647C] ${
                    errors.metodeLainnya ? "border-red-400 focus:border-red-500" : "border-[#BDC8CE]"
                  }`}
                />
                {errors.metodeLainnya && <p className="text-xs text-red-500">{errors.metodeLainnya}</p>}
              </div>
            )}
          </section>

          {/* Section 6: Catatan Pesanan */}
          <section className="flex flex-col gap-4 bg-white p-5 border border-[#F2F4F6] rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-[#191C1E] border-b border-[#F1F5F9] pb-2">
              Catatan Pesanan
            </h2>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#3E484D]">
                Catatan (Opsional)
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Masukkan catatan khusus jika ada..."
                rows={3}
                className="w-full p-4 bg-white border border-[#BDC8CE] rounded-lg outline-none focus:border-[#00647C] resize-none"
              />
            </div>
          </section>

          {/* Section 7: Resi Pesanan (PDF) */}
          <section className="flex flex-col gap-4 bg-white p-5 border border-[#F2F4F6] rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold text-[#191C1E] border-b border-[#F1F5F9] pb-2">
              Resi Pesanan (PDF)
            </h2>

            <div className="flex flex-col gap-4">
              {currentResiUrl && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <span className="font-semibold truncate max-w-[200px]">
                    📄 File Resi Saat Ini Tersimpan
                  </span>
                  <a
                    href={currentResiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline hover:opacity-85"
                  >
                    Buka PDF
                  </a>
                </div>
              )}

              {/* PDF upload box */}
              <div className="border-2 border-dashed border-[#BDC8CE] rounded-xl p-6 bg-[#F7F9FB] flex flex-col items-center gap-3 text-center transition-colors hover:border-[#00647C]">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#191C1E]">
                    {resiFile
                      ? `Resi Baru: ${resiFile.name}`
                      : "Pilih file PDF resi pengiriman baru"}
                  </span>
                  <span className="text-xs text-[#6E797E]">
                    Format PDF. Maksimal 2MB. (Opsional)
                  </span>
                </div>

                <label className="h-10 px-4 border border-[#00647C] text-[#00647C] font-semibold text-xs rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#00647C]/5 transition-colors">
                  Pilih File Baru
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResiFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Submit error */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-semibold">
              {errors.submit}
            </div>
          )}
          </fieldset>
        </div>
      </div>

      {/* Sticky Bottom Action Bar - Figma Style */}
      <div
        className="fixed bottom-[66px] left-0 right-0 z-30 px-6 py-4 bg-white border-t border-[#ECEEF0] flex flex-col gap-3 max-w-lg mx-auto w-full"
        style={{ boxShadow: "0px -4px 12px rgba(0,0,0,0.03)" }}
      >
        {isLocked ? (
          /* Pesanan sudah dikirim — tampilkan info terkunci */
          <div className="flex items-center justify-center gap-2 py-3 bg-amber-50 border border-amber-200 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span className="text-sm font-semibold text-amber-700">Pesanan sudah dikirim — tidak dapat diubah atau dihapus</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Button Simpan Perubahan */}
            <button
              type="button"
              onClick={handleSimpan}
              className="w-full h-12 bg-[#00647C] text-white font-semibold text-sm rounded-lg cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center gap-1 shadow-sm"
            >
              Simpan Perubahan
            </button>

            {/* Button Hapus Pesanan (UC-03c) */}
            <button
              type="button"
              onClick={handleDelete}
              className="w-full h-12 bg-red-600 text-white font-semibold text-sm rounded-lg cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Hapus Pesanan
            </button>

            {/* Button Batal */}
            <button
              type="button"
              onClick={() => router.push("/pemilik/pesanan")}
              className="w-full h-12 border border-[#6E797E] text-[#191C1E] font-semibold text-sm rounded-lg cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-center"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Confirm Dialog (Edit) */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Simpan Perubahan Pesanan?"
        message="Pastikan semua data pesanan yang Anda ubah sudah benar sebelum disimpan."
        confirmLabel="Simpan"
        cancelLabel="Batal"
        loading={saving}
      />

      {/* Confirm Dialog (Delete - UC-03c) */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Pesanan?"
        message="Apakah Anda yakin ingin menghapus Pesanan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        loading={deleting}
      />

      {/* Success Dialog (Edit) */}
      <SuccessDialog
        open={showSuccess}
        onClose={() => router.push("/pemilik/pesanan")}
        title="Pesanan Berhasil Diperbarui!"
        message="Perubahan informasi pesanan telah disimpan ke sistem."
        buttonLabel="Kembali ke Daftar Pesanan"
      />

      {/* Success Dialog (Delete - UC-03c) */}
      <SuccessDialog
        open={showDeleteSuccess}
        onClose={() => router.push("/pemilik/pesanan")}
        title="Pesanan Berhasil Dihapus!"
        message="Data pesanan dan seluruh item terkait telah dihapus dari sistem."
        buttonLabel="Kembali ke Daftar Pesanan"
      />
    </div>
  );
}
