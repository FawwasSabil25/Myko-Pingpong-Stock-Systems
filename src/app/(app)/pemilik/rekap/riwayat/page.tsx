"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, ChevronDownIcon, SlidersHorizontalIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getRole } from "@/lib/role";
import { MobileShell } from "@/components/MobileShell";
import { DetailHeader } from "@/components/DetailHeader";
import { StockHistoryList, type HistoryItem } from "@/components/StockHistoryList";

const PAGE_SIZE = 4;

export default function RekapRiwayatPage() {
  const router = useRouter();
  const [riwayatList, setRiwayatList] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states - MagicPatterns design
  const [period, setPeriod] = useState<string>("Bulan Ini");
  const [page, setPage] = useState(0);

  const historyPeriods = ["Bulan Ini", "Minggu Ini", "3 Bulan Terakhir"] as const;

  const fetchRiwayat = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on period
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      const startDate = new Date();
      if (period === "Minggu Ini") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === "3 Bulan Terakhir") {
        startDate.setMonth(startDate.getMonth() - 3);
      } else {
        // Bulan Ini
        startDate.setDate(1);
      }
      startDate.setHours(0, 0, 0, 0);

      const res = await fetch(`/api/rekap/riwayat?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      if (!res.ok) {
        throw new Error("Gagal memuat data pergerakan stok.");
      }
      const data = await res.json();
      
      // Format data for StockHistoryList
      const formatted: HistoryItem[] = (data || []).map((item: {
        id_histori: string | number;
        tanggal: string;
        jenis: string;
        jumlah: number;
        id_referensi?: string | null;
        varian?: {
          nama_varian?: string;
          produk?: {
            nama_produk?: string;
          };
        };
      }) => ({
        id: String(item.id_histori),
        productName: String(item.varian?.produk?.nama_produk || "Produk"),
        variant: String(item.varian?.nama_varian || "Varian"),
        date: new Date(String(item.tanggal)).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        time: new Date(String(item.tanggal)).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        timezone: "WIB",
        quantity: Number(item.jumlah),
        type: String(item.jenis),
        reference: item.id_referensi ? String(item.id_referensi) : undefined,
      }));

      setRiwayatList(formatted);
    } catch (err: unknown) {
      console.error("Error loading riwayat:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const role = getRole();
    if (role !== "pemilik") {
      router.replace("/beranda");
      return;
    }
    fetchRiwayat();
  }, [router, fetchRiwayat]);

  useEffect(() => {
    fetchRiwayat();
  }, [period, page, fetchRiwayat]);

  const pageCount = Math.ceil(riwayatList.length / PAGE_SIZE);
  const entries = riwayatList.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <MobileShell
      header={<DetailHeader title="Riwayat Pergerakan Stok" backTo="/pemilik/rekap" />}
    >
      <div className="space-y-6">
        <section>
          <p className="text-sm font-semibold text-brand-600">Rekap · Aktivitas stok</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-900">
            Riwayat Pergerakan Stok
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Log kronologis aktivitas stok masuk dan keluar.
          </p>
        </section>

        <section
          aria-label="Filter riwayat"
          className="flex items-center gap-3 rounded-3xl border border-white/60 bg-gradient-to-br from-brand-300 via-brand-200 to-brand-100 p-3 shadow-card"
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Pilih periode</span>
            <CalendarIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500"
              aria-hidden="true"
            />
            <select
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value);
                setPage(0);
              }}
              className="w-full appearance-none rounded-2xl border border-white/70 bg-gradient-to-b from-white to-brand-50 py-3 pl-11 pr-10 text-sm font-bold text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
            >
              {historyPeriods.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600"
              aria-hidden="true"
            />
          </label>

          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 px-4 py-3 text-sm font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          >
            <SlidersHorizontalIcon className="h-4 w-4" strokeWidth={2.4} />
            Filter
          </button>
        </section>

        <StockHistoryList
          entries={entries}
          rangeStart={riwayatList.length > 0 ? page * PAGE_SIZE + 1 : 0}
          rangeEnd={page * PAGE_SIZE + entries.length}
          totalEntries={riwayatList.length}
          canGoBack={page > 0}
          canGoForward={page < pageCount - 1}
          onBack={() => setPage((current) => Math.max(0, current - 1))}
          onForward={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
        />
      </div>
    </MobileShell>
  );
}