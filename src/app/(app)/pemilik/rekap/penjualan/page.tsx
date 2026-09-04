"use client";

import { useEffect, useState } from "react";
import { BanknoteIcon, ShoppingCartIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DetailHeader } from "@/components/DetailHeader";
import { SalesMetricCard, type SalesMetric } from "@/components/SalesMetricCard";
import { SalesBreakdownTable, type SalesRow } from "@/components/SalesBreakdownTable";

export type SalesPeriod = 'Mingguan' | 'Bulanan';

const salesPeriods: SalesPeriod[] = ['Mingguan', 'Bulanan'];

export default function RekapPenjualanPage() {
  const [period, setPeriod] = useState<SalesPeriod>('Bulanan');
  const [loading, setLoading] = useState(true);

  const [revenueMetric, setRevenueMetric] = useState<SalesMetric>({
    label: 'Total Pendapatan',
    value: 'Rp 0',
    delta: 12,
    deltaLabel: 'dari periode lalu',
    channels: [],
  });

  const [unitsMetric, setUnitsMetric] = useState<SalesMetric>({
    label: 'Barang Terjual',
    value: '0 pcs',
    delta: 8,
    deltaLabel: 'dari periode lalu',
    channels: [],
  });

  const [salesRows, setSalesRows] = useState<SalesRow[]>([]);

  useEffect(() => {
    fetchSalesData(period);
  }, [period]);

  async function fetchSalesData(selectedPeriod: SalesPeriod) {
    try {
      setLoading(true);

      // Determine date boundary
      const startDate = new Date();
      if (selectedPeriod === 'Mingguan') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setDate(1); // start of month
      }
      startDate.setHours(0, 0, 0, 0);

      // 1. Query histori_stok for outgoing items
      const { data: histData, error: histErr } = await supabase
        .from("histori_stok")
        .select(`
          jumlah,
          tanggal,
          varian (
            id_varian,
            nama_varian,
            produk (
              id_produk,
              nama_produk,
              harga,
              foto_url
            )
          )
        `)
        .eq("jenis", "keluar")
        .gte("tanggal", startDate.toISOString());

      if (histErr) throw histErr;

      const parsedHist = histData || [];

      // 2. Query orders for platform breakdown
      const { data: orderData, error: orderErr } = await supabase
        .from("pesanan")
        .select(`
          platform,
          detail_pesanan (
            jumlah,
            varian (
              produk (
                harga
              )
            )
          )
        `)
        .gte("tanggal_input", startDate.toISOString());

      if (orderErr) console.error("Error fetching order breakdown:", orderErr);

      // Calculate platform breakdown
      const platformMap: Record<string, { revenue: number; units: number }> = {};
      (orderData || []).forEach((ord: any) => {
        const plat = ord.platform || "Lainnya";
        if (!platformMap[plat]) platformMap[plat] = { revenue: 0, units: 0 };

        (ord.detail_pesanan || []).forEach((det: any) => {
          const qty = det.jumlah || 0;
          const harga = det.varian?.produk?.harga || 0;
          platformMap[plat].units += qty;
          platformMap[plat].revenue += qty * harga;
        });
      });

      // Calculate total metrics & product breakdown
      let totalRev = 0;
      let totalUnits = 0;
      const productMap: Record<string, { name: string; sold: number; revenue: number; image?: string | null }> = {};

      parsedHist.forEach((h: any) => {
        const qty = h.jumlah || 0;
        const harga = h.varian?.produk?.harga || 0;
        const prod = h.varian?.produk;

        totalUnits += qty;
        totalRev += qty * harga;

        if (prod && prod.id_produk) {
          if (!productMap[prod.id_produk]) {
            productMap[prod.id_produk] = {
              name: prod.nama_produk,
              sold: 0,
              revenue: 0,
              image: prod.foto_url,
            };
          }
          productMap[prod.id_produk].sold += qty;
          productMap[prod.id_produk].revenue += qty * harga;
        }
      });

      // Format revenue metric
      const channelRevSplits = Object.keys(platformMap).map((plat) => ({
        channel: plat,
        value: `Rp ${platformMap[plat].revenue.toLocaleString("id-ID")}`,
      }));

      // Format units metric
      const channelUnitSplits = Object.keys(platformMap).map((plat) => ({
        channel: plat,
        value: `${platformMap[plat].units} item`,
      }));

      setRevenueMetric({
        label: "Total Pendapatan",
        value: `Rp ${totalRev.toLocaleString("id-ID")}`,
        delta: 12,
        deltaLabel: selectedPeriod === "Mingguan" ? "dari minggu lalu" : "dari bulan lalu",
        channels: channelRevSplits,
      });

      setUnitsMetric({
        label: "Barang Terjual",
        value: `${totalUnits} pcs`,
        delta: 5,
        deltaLabel: selectedPeriod === "Mingguan" ? "dari minggu lalu" : "dari bulan lalu",
        channels: channelUnitSplits,
      });

      // Format rows
      const rows: SalesRow[] = Object.keys(productMap).map((id_prod) => ({
        id: id_prod,
        name: productMap[id_prod].name,
        sold: productMap[id_prod].sold,
        revenue: `Rp ${productMap[id_prod].revenue.toLocaleString("id-ID")}`,
        image: productMap[id_prod].image,
      }));

      setSalesRows(rows.sort((a, b) => b.sold - a.sold));
    } catch (err) {
      console.error("Error loading sales report:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <DetailHeader title="Rekap Penjualan" backTo="/pemilik/rekap" />

      <main className="px-5 pb-24 pt-6 max-w-md mx-auto space-y-6">
        <section>
          <p className="text-sm font-semibold text-brand-600">Laporan penjualan</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight text-brand-900">
            Rekap Penjualan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ringkasan performa penjualan produk dan pergerakan stok.
          </p>

          <div
            role="tablist"
            aria-label="Periode laporan"
            className="mt-4 inline-flex rounded-2xl border border-white/70 bg-gradient-to-r from-brand-100 to-brand-200 p-1 shadow-card"
          >
            {salesPeriods.map((option) => {
              const isActive = option === period;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setPeriod(option)}
                  className={[
                    'rounded-xl px-5 py-2 text-sm font-bold transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer',
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-900 text-white shadow-lift'
                      : 'text-brand-700 hover:bg-white/60',
                  ].join(' ')}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <SalesMetricCard metric={revenueMetric} icon={BanknoteIcon} index={0} />
            <SalesMetricCard metric={unitsMetric} icon={ShoppingCartIcon} index={1} />
            <SalesBreakdownTable rows={salesRows} />
          </>
        )}
      </main>
    </div>
  );
}
