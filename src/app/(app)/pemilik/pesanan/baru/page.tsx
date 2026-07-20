"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getRole } from "@/lib/role";
import { ConfirmDialog, SuccessDialog } from "@/components/Dialog";

interface Varian {
  id_varian: string;
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
}

interface Produk {
  id_produk: string;
  nama_produk: string;
  kategori: string | null;
  varian: Varian[];
}

interface OrderItem {
  id_varian: string;
  nama_produk: string;
  nama_varian: string;
  jumlah: number;
  jumlah_stok: number;
}

export default function InputPesananBaruPage() {
  const router = useRouter();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // New Form Fields states
  const [platform, setPlatform] = useState("");
  const [noPesanan, setNoPesanan] = useState("");
  const [namaPelanggan, setNamaPelanggan] = useState("");
  const [metodePengiriman, setMetodePengiriman] = useState("");
  const [customShipping, setCustomShipping] = useState("");
  const [catatan, setCatatan] = useState("");

  // Product/Varian selection states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVarianId, setSelectedVarianId] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Autocomplete/Combobox States (UX 3)
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [varianSearch, setVarianSearch] = useState("");
  const [showVarianDropdown, setShowVarianDropdown] = useState(false);

  // filtered lists are defined below activeVariants to avoid reference errors

  // Order items state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Action and Dialog states
  const [shouldNotify, setShouldNotify] = useState(true); // Flag to control WA notification
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [stockErrors, setStockErrors] = useState<string[]>([]);

  useEffect(() => {
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }
    fetchProdukDanVarian();
  }, [router]);

  async function fetchProdukDanVarian() {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("produk")
        .select("*, varian(*)")
        .order("nama_produk", { ascending: true });

      if (error) throw error;
      setProdukList((data as Produk[]) || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setFormError("Gagal mengambil data produk dari database.");
    } finally {
      setLoadingProducts(false);
    }
  }

  // Get current active product and its variants
  const activeProduct = produkList.find((p) => p.id_produk === selectedProductId);
  const activeVariants = activeProduct ? activeProduct.varian : [];
  const activeVarian = activeVariants.find((v) => v.id_varian === selectedVarianId);

  const filteredProducts = produkList.filter((p) =>
    p.nama_produk.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredVariants = activeVariants.filter((v) =>
    v.nama_varian.toLowerCase().includes(varianSearch.toLowerCase())
  );

  // Handle adding item to order list
  function handleAddItem() {
    if (!selectedProductId || !selectedVarianId) {
      setFormError("Silakan pilih produk dan varian terlebih dahulu.");
      return;
    }

    if (jumlah <= 0) {
      setFormError("Jumlah pesanan harus lebih besar dari 0.");
      return;
    }

    if (!activeProduct || !activeVarian) return;

    // Cek apakah item sudah ada di list
    const existingIndex = orderItems.findIndex(
      (item) => item.id_varian === selectedVarianId
    );

    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].jumlah += jumlah;
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          id_varian: selectedVarianId,
          nama_produk: activeProduct.nama_produk,
          nama_varian: activeVarian.nama_varian,
          jumlah: jumlah,
          jumlah_stok: activeVarian.jumlah_stok,
        },
      ]);
    }

    // Reset input
    setJumlah(1);
    setSelectedVarianId("");
    setVarianSearch("");
    setFormError(null);
    setStockErrors([]); // Clear any previous validations when adding items
  }

  // Handle removing item from order list
  function handleRemoveItem(index: number) {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
    setStockErrors([]);
  }

  // File Upload PDF validation helper
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
        setFormError("Resi harus berupa file PDF (.pdf).");
        setSelectedFile(null);
        e.target.value = "";
      } else {
        setSelectedFile(file);
        setFormError(null);
      }
    }
  }

  // Submit Order (Validate fields and Stock levels)
  async function handleSubmitOrder(notify: boolean) {
    setShouldNotify(notify);

    // 1. Validasi field wajib (Business Rule #10)
    if (!platform) {
      setFormError("Platform/Sumber pesanan wajib diisi.");
      return;
    }
    if (!metodePengiriman) {
      setFormError("Metode pengiriman wajib diisi.");
      return;
    }
    if (metodePengiriman === "Lainnya" && !customShipping.trim()) {
      setFormError("Silakan isi metode pengiriman lainnya.");
      return;
    }

    if (orderItems.length === 0) {
      setFormError("Daftar item pesanan kosong. Harap tambahkan minimal 1 item.");
      return;
    }

    // 2. Business Rule #4: Validasi stok (jumlah_stok >= jumlah)
    const errors: string[] = [];
    orderItems.forEach((item) => {
      if (item.jumlah > item.jumlah_stok) {
        errors.push(
          `Stok tidak mencukupi untuk: ${item.nama_produk} (${item.nama_varian}) — Tersedia: ${item.jumlah_stok} pcs, Dipesan: ${item.jumlah} pcs`
        );
      }
    });

    if (errors.length > 0) {
      setStockErrors(errors);
      setFormError(null);
      return; // JANGAN lanjut ke dialog konfirmasi
    }

    // Validasi lolos, tampilkan dialog konfirmasi
    setStockErrors([]);
    setFormError(null);
    setShowConfirm(true);
  }

  // Process saving to database
  async function handleConfirmSave() {
    setIsSaving(true);
    try {
      let resiUrl = null;

      // 1. Upload Resi PDF if present
      if (selectedFile) {
        const fileForm = new FormData();
        fileForm.append("file", selectedFile);

        const uploadRes = await fetch("/api/pesanan/upload-resi", {
          method: "POST",
          body: fileForm,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Gagal mengunggah resi PDF.");
        }

        const uploadData = await uploadRes.json();
        resiUrl = uploadData.publicUrl;
      }

      // 2. Simpan Pesanan & Detail Pesanan via API
      const shippingValue = metodePengiriman === "Lainnya" ? customShipping.trim() : metodePengiriman;

      const saveRes = await fetch("/api/pesanan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems.map((item) => ({
            id_varian: item.id_varian,
            jumlah: item.jumlah,
          })),
          resi_url: resiUrl,
          platform: platform,
          no_pesanan: noPesanan.trim() !== "" ? noPesanan.trim() : null,
          nama_pelanggan: namaPelanggan.trim() !== "" ? namaPelanggan.trim() : null,
          metode_pengiriman: shippingValue,
          catatan: catatan.trim() !== "" ? catatan.trim() : null,
          kirim_notifikasi: shouldNotify,
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || "Gagal menyimpan data pesanan.");
      }

      // Simpan berhasil, tampilkan success dialog
      setShowConfirm(false);
      setShowSuccess(true);
    } catch (err: any) {
      console.error("Error saving order:", err);
      setFormError(err.message || "Terjadi kesalahan saat menyimpan pesanan.");
      setShowConfirm(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccess(false);
    router.push("/pemilik/pesanan");
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-6 bg-white border-b border-[#F1F5F9]"
        style={{
          height: "64px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Link
          href="/pemilik/pesanan"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00647C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1
          className="text-lg font-bold leading-6"
          style={{ color: "#00647C" }}
        >
          Input Pesanan Masuk
        </h1>
      </header>

      {/* Main Content Form */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-6 max-w-lg mx-auto w-full pb-[120px]">

        {/* Card 1: Informasi Pesanan (Baru) */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-4 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}
        >
          <h2
            className="text-base font-bold uppercase tracking-wider border-b border-[#F1F5F9] pb-2"
            style={{ color: "#191C1E" }}
          >
            Informasi Pesanan
          </h2>

          {/* Platform Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6E797E] uppercase">
              Platform/Sumber Pesanan <span className="text-red-500">*</span>
            </label>
            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setFormError(null);
              }}
              className="w-full h-11 px-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C]"
            >
              <option value="">-- Pilih Platform --</option>
              <option value="Shopee">Shopee</option>
              <option value="Tokopedia">Tokopedia</option>
            </select>
          </div>

          {/* No. Pesanan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6E797E] uppercase">
              No. Pesanan / Invoice (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: SPX12984928"
              value={noPesanan}
              onChange={(e) => setNoPesanan(e.target.value)}
              className="w-full h-11 px-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C]"
            />
          </div>

          {/* Nama Pelanggan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6E797E] uppercase">
              Nama Pelanggan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Masukkan nama pelanggan (opsional)"
              value={namaPelanggan}
              onChange={(e) => {
                setNamaPelanggan(e.target.value);
                setFormError(null);
              }}
              className="w-full h-11 px-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C]"
            />
          </div>

          {/* Metode Pengiriman Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6E797E] uppercase">
              Metode Pengiriman <span className="text-red-500">*</span>
            </label>
            <select
              value={metodePengiriman}
              onChange={(e) => {
                setMetodePengiriman(e.target.value);
                setCustomShipping("");
                setFormError(null);
              }}
              className="w-full h-11 px-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C]"
            >
              <option value="">-- Pilih Metode Pengiriman --</option>
              <option value="Diserahkan ke JNE">Diserahkan ke JNE</option>
              <option value="Diserahkan ke JNT">Diserahkan ke JNT</option>
              <option value="Dijemput Kurir">Dijemput Kurir</option>
              <option value="Lainnya">Lainnya (Isi Manual)</option>
            </select>
          </div>

          {/* Custom Shipping (only shown if "Lainnya" selected) */}
          {metodePengiriman === "Lainnya" && (
            <div className="flex flex-col gap-1.5 animate-[fadeIn_150ms_ease-out]">
              <label className="text-xs font-bold text-[#6E797E] uppercase">
                Isi Metode Pengiriman Lainnya <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Ambil Sendiri, Kirim via Grab"
                value={customShipping}
                onChange={(e) => {
                  setCustomShipping(e.target.value);
                  setFormError(null);
                }}
                className="w-full h-11 px-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C]"
              />
            </div>
          )}

          {/* Catatan Pesanan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6E797E] uppercase">
              Catatan Pesanan (Opsional)
            </label>
            <textarea
              placeholder="Catatan tambahan seperti warna, packing kayu, dll."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full h-20 p-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C] resize-none"
            />
          </div>
        </div>

        {/* Card 2: Pilih Item Pesanan */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-4 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}
        >
          <h2
            className="text-base font-bold uppercase tracking-wider border-b border-[#F1F5F9] pb-2"
            style={{ color: "#191C1E" }}
          >
            Pilih Item Pesanan
          </h2>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#00647C]/30 border-t-[#00647C] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Product selection (UX 3 Autocomplete) */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-[#6E797E] uppercase">
                  Pilih Produk
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari nama produk..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                      if (selectedProductId) {
                        setSelectedProductId("");
                        setSelectedVarianId("");
                        setVarianSearch("");
                      }
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowProductDropdown(false);
                        const selected = produkList.find((p) => p.id_produk === selectedProductId);
                        if (selected) {
                          setProductSearch(selected.nama_produk);
                        } else {
                          setProductSearch("");
                        }
                      }, 200);
                    }}
                    className="w-full h-11 px-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C]"
                  />
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#BDC8CE] rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1">
                      {filteredProducts.map((p) => (
                        <li
                          key={p.id_produk}
                          onMouseDown={() => {
                            setSelectedProductId(p.id_produk);
                            setProductSearch(p.nama_produk);
                            setSelectedVarianId("");
                            setVarianSearch("");
                            setShowProductDropdown(false);
                            setFormError(null);
                          }}
                          className="px-3 py-2.5 hover:bg-[#F2F4F7] cursor-pointer text-xs text-[#191C1E] transition-colors"
                        >
                          {p.nama_produk}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Variant selection (UX 3 Autocomplete) */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-[#6E797E] uppercase">
                  Pilih Varian
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={selectedProductId ? "Cari nama varian..." : "Pilih produk terlebih dahulu"}
                    value={varianSearch}
                    disabled={!selectedProductId}
                    onChange={(e) => {
                      setVarianSearch(e.target.value);
                      setShowVarianDropdown(true);
                      if (selectedVarianId) {
                        setSelectedVarianId("");
                      }
                    }}
                    onFocus={() => setShowVarianDropdown(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowVarianDropdown(false);
                        const selected = activeVariants.find((v) => v.id_varian === selectedVarianId);
                        if (selected) {
                          setVarianSearch(`${selected.nama_varian} (Stok: ${selected.jumlah_stok} pcs)`);
                        } else {
                          setVarianSearch("");
                        }
                      }, 200);
                    }}
                    className="w-full h-11 px-3 border border-[#BDC8CE] rounded bg-white text-sm focus:outline-none focus:border-[#00647C] disabled:bg-gray-50 disabled:text-gray-400"
                  />
                  {showVarianDropdown && selectedProductId && filteredVariants.length > 0 && (
                    <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#BDC8CE] rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 py-1">
                      {filteredVariants.map((v) => (
                        <li
                          key={v.id_varian}
                          onMouseDown={() => {
                            setSelectedVarianId(v.id_varian);
                            setVarianSearch(`${v.nama_varian} (Stok: ${v.jumlah_stok} pcs)`);
                            setShowVarianDropdown(false);
                            setFormError(null);
                          }}
                          className="px-3 py-2.5 hover:bg-[#F2F4F7] cursor-pointer text-xs text-[#191C1E] transition-colors"
                        >
                          {v.nama_varian} (Stok: {v.jumlah_stok} pcs)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6E797E] uppercase">
                  Jumlah Item
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setJumlah(Math.max(1, jumlah - 1))}
                    disabled={!selectedVarianId || jumlah <= 1}
                    className="w-11 h-11 flex items-center justify-center border border-[#BDC8CE] rounded bg-white text-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={jumlah}
                    disabled={!selectedVarianId}
                    onChange={(e) => setJumlah(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-11 text-center border border-[#BDC8CE] rounded text-base font-semibold focus:outline-none focus:border-[#00647C]"
                  />
                  <button
                    type="button"
                    onClick={() => setJumlah(jumlah + 1)}
                    disabled={!selectedVarianId}
                    className="w-11 h-11 flex items-center justify-center border border-[#BDC8CE] rounded bg-white text-lg font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedVarianId}
                className="w-full h-11 mt-2 text-sm font-semibold rounded text-[#00647C] bg-cyan-50 border border-[#00647C]/20 hover:bg-[#ecfeff] transition-colors cursor-pointer disabled:opacity-50"
              >
                Tambah ke Daftar Pesanan
              </button>
            </>
          )}
        </div>

        {/* Card 3: Selected Items Preview */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-4 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}
        >
          <h2
            className="text-base font-bold uppercase tracking-wider border-b border-[#F1F5F9] pb-2"
            style={{ color: "#191C1E" }}
          >
            Daftar Item ({orderItems.length} Produk)
          </h2>

          {orderItems.length === 0 ? (
            <p className="text-sm text-center py-6 text-[#6E797E]">
              Belum ada item ditambahkan ke daftar pesanan.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {orderItems.map((item, index) => {
                const isInsufficient = item.jumlah > item.jumlah_stok;

                return (
                  <li
                    key={item.id_varian}
                    className={`flex items-start justify-between p-3 rounded-lg border transition-all ${isInsufficient
                        ? "bg-red-50/50 border-red-200"
                        : "bg-[#F8FAFC] border-[#E2E8F0]"
                      }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-sm font-bold text-[#191C1E] truncate">
                        {item.nama_produk}
                      </span>
                      <span className="text-xs text-[#6E797E] mt-0.5">
                        Varian: {item.nama_varian}
                      </span>
                      <span
                        className={`text-[11px] font-semibold mt-1 ${isInsufficient ? "text-red-600" : "text-[#6E797E]"
                          }`}
                      >
                        Stok Tersedia: {item.jumlah_stok} pcs
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-extrabold text-[#191C1E]">
                          x{item.jumlah}
                        </span>
                        {isInsufficient && (
                          <span className="text-[10px] font-bold text-red-600 mt-0.5">
                            Stok Kurang!
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Hapus item"
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
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Card 4: Resi PDF Form */}
        <div
          className="bg-white rounded-xl p-5 flex flex-col gap-4 border border-[#E2E8F0]"
          style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.03)" }}
        >
          <h2
            className="text-base font-bold uppercase tracking-wider border-b border-[#F1F5F9] pb-2"
            style={{ color: "#191C1E" }}
          >
            Resi Pengiriman (PDF)
          </h2>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#6E797E]">
              Unggah resi pengiriman berformat PDF.
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-xs file:font-semibold
                file:bg-cyan-50 file:text-[#00647C]
                hover:file:bg-[#ecfeff]
                cursor-pointer file:cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded text-xs">
                <span className="font-semibold text-green-800 truncate max-w-[200px]">
                  📄 {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert Box */}
        {formError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-[fadeIn_150ms_ease-out]">
            <svg
              className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-600 font-semibold">{formError}</p>
          </div>
        )}

        {/* Stock Validation Error Banner (Business Rule #4) */}
        {stockErrors.length > 0 && (
          <div className="flex flex-col gap-2 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm animate-[fadeIn_150ms_ease-out]">
            <div className="flex items-center gap-2 text-red-700">
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <h3 className="text-sm font-bold uppercase tracking-wide">
                Stok Tidak Mencukupi!
              </h3>
            </div>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              {stockErrors.map((err, i) => (
                <li key={i} className="text-xs text-red-700 font-medium">
                  {err}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-red-600 italic mt-1 font-semibold">
              *Harap kurangi jumlah pesanan atau lakukan restok terlebih dahulu. Dialog konfirmasi tidak dapat ditampilkan.
            </p>
          </div>
        )}

        {/* Two Stacked Action Buttons (Revision) */}
        <div className="flex flex-col gap-3.5 mt-2">
          {/* Button 1: Save & Send WA (Primary, Green/Cyan) */}
          <button
            type="button"
            onClick={() => handleSubmitOrder(true)}
            className="w-full h-12 flex items-center justify-center gap-2 rounded text-base font-bold text-white transition-opacity hover:opacity-95 cursor-pointer"
            style={{
              backgroundColor: "#16A34A", // Green color for "Save & Send WA"
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            Simpan & Kirim Notifikasi WA
          </button>

          {/* Button 2: Save Only (Secondary, White/Gray) */}
          <button
            type="button"
            onClick={() => handleSubmitOrder(false)}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-base font-semibold border border-[#BDC8CE] bg-white hover:bg-gray-50 transition-colors cursor-pointer text-[#3E484D]"
            style={{
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Simpan Saja
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title="Simpan Pesanan"
        message={`Apakah Anda yakin ingin memasukkan pesanan ini ke dalam sistem? ${shouldNotify
            ? "Tindakan ini akan mencatat pesanan baru dan mengirimkan log WhatsApp stub ke Pengelola."
            : "Tindakan ini akan mencatat pesanan baru TANPA mengirimkan notifikasi WhatsApp."
          }`}
        confirmLabel="Ya, Simpan"
        cancelLabel="Batal"
        loading={isSaving}
      />

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccess}
        onClose={handleSuccessClose}
        title="Pesanan Ditambahkan!"
        message={`Pesanan baru berhasil disimpan ke database. ${shouldNotify
            ? "Notifikasi WhatsApp stub telah dicatat ke console log pengelola."
            : "Tidak ada notifikasi WhatsApp yang dikirimkan."
          }`}
        buttonLabel="Kembali ke Daftar Pesanan"
      />
    </div>
  );
}
