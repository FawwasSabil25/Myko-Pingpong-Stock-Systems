"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
  created_at: string;
  harga?: number | null;
  foto_url?: string | null;
  varian: Varian[];
}

export default function ProdukPage() {
  const router = useRouter();
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState<string | null>(null);

  useEffect(() => {
    fetchProduk();
  }, []);

  async function fetchProduk() {
    setLoading(true);
    const { data, error } = await supabase
      .from("produk")
      .select("*, varian(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching produk:", error);
    } else {
      setProdukList((data as Produk[]) || []);
    }
    setLoading(false);
  }

  // Extract unique categories for filter pills
  const categories = useMemo(() => {
    const cats = new Set<string>();
    produkList.forEach((p) => {
      if (p.kategori) cats.add(p.kategori);
    });
    return Array.from(cats).sort();
  }, [produkList]);

  // Filtered list
  const filtered = useMemo(() => {
    const list = produkList.filter((p) => {
      const matchSearch =
        !search ||
        p.nama_produk.toLowerCase().includes(search.toLowerCase());
      const matchKategori =
        !activeKategori || p.kategori === activeKategori;
      return matchSearch && matchKategori;
    });

    // Sort: products with any variant with stock <= reorder_point go to the top
    return [...list].sort((a, b) => {
      const aLow = hasLowStockVariant(a.varian) ? 1 : 0;
      const bLow = hasLowStockVariant(b.varian) ? 1 : 0;
      return bLow - aLow;
    });
  }, [produkList, search, activeKategori]);

  function getTotalStok(varian: Varian[]) {
    return varian.reduce((sum, v) => sum + v.jumlah_stok, 0);
  }

  // SR-06: Check if any variant is at or below reorder point
  function hasLowStockVariant(varian: Varian[]) {
    return varian.some((v) => v.reorder_point > 0 && v.jumlah_stok <= v.reorder_point);
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main Canvas */}
      <div className="flex flex-col gap-6 p-6">
        {/* Page Header & Actions */}
        <div className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col gap-1">
            <h1
              className="text-[30px] font-bold leading-[38px]"
              style={{ color: "#191C1E" }}
            >
              Kelola Produk
            </h1>
            <p className="text-base leading-6" style={{ color: "#3E484D" }}>
              Manajemen data produk dan katalog barang.
            </p>
          </div>

          <Link
            href="/produk/tambah"
            className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold text-white rounded-lg self-start transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#00647C",
              boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            Tambah Produk Baru
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </Link>
        </div>

        {/* Filters & Search */}
        <div
          className="flex flex-col gap-4 p-4 bg-white rounded-xl"
          style={{ boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }}
        >
          {/* Search input */}
          <div
            className="flex items-center h-[49px] bg-[#F7F9FB] border border-[#BDC8CE] rounded-lg px-3 gap-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6E797E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-base outline-none placeholder:text-[#6E797E]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6E797E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveKategori(null)}
                className={`h-[38px] px-4 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                  activeKategori === null
                    ? "bg-[#DAE2FD] text-[#5C647A]"
                    : "bg-[#F7F9FB] border border-[#BDC8CE] text-[#191C1E]"
                }`}
              >
                Semua Kategori
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setActiveKategori(activeKategori === cat ? null : cat)
                  }
                  className={`h-[38px] px-4 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                    activeKategori === cat
                      ? "bg-[#DAE2FD] text-[#5C647A]"
                      : "bg-[#F7F9FB] border border-[#BDC8CE] text-[#191C1E]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#BDC8CE"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
            <p className="text-sm" style={{ color: "#6E797E" }}>
              {search || activeKategori
                ? "Tidak ada produk yang cocok dengan filter."
                : "Belum ada produk. Tambah produk pertama Anda!"}
            </p>
            {(search || activeKategori) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveKategori(null);
                }}
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                style={{
                  color: "#00647C",
                  backgroundColor: "rgba(0,100,124,0.08)",
                }}
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((produk) => {
              const totalStok = getTotalStok(produk.varian);
              const varianCount = produk.varian.length;
              const isLow = hasLowStockVariant(produk.varian);

              return (
                <button
                  key={produk.id_produk}
                  type="button"
                  onClick={() => router.push(`/produk/${produk.id_produk}`)}
                  className="w-full text-left rounded-xl p-[17px] flex flex-col gap-4 transition-shadow hover:shadow-md cursor-pointer border"
                  style={{
                    boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
                    backgroundColor: isLow ? "#FFDAD6" : "#FFFFFF",
                    borderColor: isLow ? "rgba(186, 26, 26, 0.2)" : "transparent",
                  }}
                >
                  {/* Top row: icon + info */}
                  <div className="flex gap-4">
                    {/* Product image or placeholder */}
                    <div className="w-20 h-20 rounded-lg bg-[#ECEEF0] overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                      {produk.foto_url ? (
                        <img
                          src={produk.foto_url}
                          alt={produk.nama_produk}
                          className="w-full h-full object-cover"
                        />
                      ) : (
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
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      {/* Category badge */}
                      {produk.kategori && (
                        <span
                          className="self-start text-[10px] leading-[15px] px-2 py-0.5 rounded-sm"
                          style={{
                            backgroundColor: "#E0E3E5",
                            color: "#3E484D",
                          }}
                        >
                          {produk.kategori.toUpperCase()}
                        </span>
                      )}
                      {/* Name */}
                      <h3
                        className="text-xl font-medium leading-[25px] truncate"
                        style={{ color: "#191C1E" }}
                      >
                        {produk.nama_produk}
                      </h3>
                      {/* Variant count & Price */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs" style={{ color: "#6E797E" }}>
                          {varianCount} varian
                        </span>
                        {produk.harga !== null && produk.harga !== undefined && (
                          <span className="text-sm font-extrabold text-[#00647C]">
                            Rp {produk.harga.toLocaleString("id-ID")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-start pt-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94A3B8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom row: stock info with SR-06 low stock indicator */}
                  <div
                    className="flex items-center justify-between pt-3 border-t w-full"
                    style={{
                      borderColor: isLow ? "rgba(186, 26, 26, 0.2)" : "#E0E3E5",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: isLow
                            ? "#EF4444"
                            : totalStok > 0
                              ? "#22C55E"
                              : "#EF4444",
                        }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: isLow ? "#BA1A1A" : "#3E484D",
                        }}
                      >
                        Stok: {totalStok} pcs {isLow && "(Rendah)"}
                      </span>
                    </div>

                    <span
                      className="text-xs font-medium px-2 py-1 rounded-md"
                      style={{
                        backgroundColor: isLow
                          ? "rgba(239,68,68,0.1)"
                          : totalStok > 0
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(239,68,68,0.1)",
                        color: isLow
                          ? "#DC2626"
                          : totalStok > 0
                            ? "#16A34A"
                            : "#DC2626",
                      }}
                    >
                      {isLow ? "Stok Rendah" : totalStok > 0 ? "Tersedia" : "Habis"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
