"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PackageSearchIcon, PlusIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";
import { ProductFilters } from "@/components/ProductFilters";
import { ProductCard, type Product } from "@/components/ProductCard";

interface VarianData {
  id_varian: string;
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
  lokasi_penyimpanan?: string | null;
}

interface ProdukData {
  id_produk: string;
  nama_produk: string;
  kategori: string | null;
  created_at: string;
  harga?: number | null;
  foto_url?: string | null;
  varian: VarianData[];
}

export default function ProdukPage() {
  const router = useRouter();
  const [produkList, setProdukList] = useState<ProdukData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Semua Kategori");

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
      setProdukList((data as ProdukData[]) || []);
    }
    setLoading(false);
  }

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    produkList.forEach((p) => {
      if (p.kategori) cats.add(p.kategori);
    });
    return ["Semua Kategori", ...Array.from(cats).sort()];
  }, [produkList]);

  // Map to ProductCard structure & filter
  const formattedProducts = useMemo(() => {
    return produkList.map((p) => {
      const totalStock = p.varian.reduce((sum, v) => sum + v.jumlah_stok, 0);
      const minRop = p.varian.length > 0 ? Math.max(...p.varian.map((v) => v.reorder_point)) : 0;
      const isLow = p.varian.some((v) => v.reorder_point > 0 && v.jumlah_stok <= v.reorder_point);

      const mappedProduct: Product = {
        id: p.id_produk,
        name: p.nama_produk,
        category: p.kategori || "Umum",
        price: p.harga || 0,
        stock: totalStock,
        stockUnit: "pcs",
        lowStockThreshold: isLow ? totalStock : minRop - 1, // trigger isLow logic
        image: p.foto_url,
        addedAt: new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        variants: p.varian.map((v) => ({
          code: v.nama_varian,
          location: v.lokasi_penyimpanan || "-",
          stock: v.jumlah_stok,
          rop: v.reorder_point,
        })),
      };

      return { mappedProduct, isLow };
    });
  }, [produkList]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = formattedProducts.filter(({ mappedProduct }) => {
      const matchesCategory =
        category === "Semua Kategori" || mappedProduct.category === category;
      const matchesQuery = mappedProduct.name.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });

    // Sort products with low stock to top
    return list.sort((a, b) => (b.isLow ? 1 : 0) - (a.isLow ? 1 : 0));
  }, [formattedProducts, query, category]);

  const lowCount = formattedProducts.filter((p) => p.isLow).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <AppHeader storeName="Myko Pingpong" initial="W" />

      <main className="px-5 pb-24 pt-6 max-w-md mx-auto space-y-6">
        <section>
          <p className="text-sm font-semibold text-brand-600">Katalog barang</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-900">
            Kelola Produk
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manajemen data produk dan katalog barang.
          </p>
          {lowCount > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-alert-50 to-alert-100 px-3 py-1 text-xs font-bold text-alert-700">
              {lowCount} produk perlu restok
            </p>
          )}
        </section>

        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
        >
          <Link
            href="/produk/tambah"
            className="relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-700 to-brand-900 px-5 py-4 text-lg font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent"
            />
            <PlusIcon className="relative h-6 w-6" strokeWidth={2.6} />
            <span className="relative">Tambah Produk Baru</span>
          </Link>
        </motion.div>

        <ProductFilters
          query={query}
          onQueryChange={setQuery}
          activeCategory={category}
          onCategoryChange={setCategory}
          categories={categories}
          resultCount={filtered.length}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <ul className="space-y-4">
            {filtered.map(({ mappedProduct }, index) => (
              <ProductCard key={mappedProduct.id} product={mappedProduct} index={index} />
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-8 text-center shadow-card">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-300">
              <PackageSearchIcon className="h-7 w-7 text-brand-700" aria-hidden="true" />
            </span>
            <p className="mt-4 text-base font-extrabold text-brand-900">
              Produk tidak ditemukan
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Coba ubah kata kunci atau pilih kategori lain.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
