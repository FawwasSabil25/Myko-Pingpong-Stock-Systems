import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/rekap/penjualan
 *
 * Mengambil data histori_stok dengan jenis = 'keluar' (penjualan) dalam periode tertentu.
 * Mengembalikan daftar transaksi individual untuk format tabel penjualan pemilik.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Hitung range tanggal berdasarkan periode
    const now = new Date();
    let start = new Date();

    if (periode === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (periode === "week") {
      start.setDate(now.getDate() - 7);
    } else if (periode === "month") {
      start.setDate(now.getDate() - 30);
    } else if (periode === "custom" && startDate) {
      start = new Date(startDate);
    } else {
      start.setDate(now.getDate() - 30);
    }

    let query = supabase
      .from("histori_stok")
      .select(`
        id_histori,
        jenis,
        jumlah,
        tanggal,
        varian!inner (
          id_varian,
          nama_varian,
          produk!inner (
            id_produk,
            nama_produk,
            harga
          )
        )
      `)
      .eq("jenis", "keluar")
      .order("tanggal", { ascending: false });

    if (periode === "custom") {
      if (startDate && startDate.trim() !== "") {
        query = query.gte("tanggal", start.toISOString());
      }
      if (endDate && endDate.trim() !== "") {
        const endOfDate = new Date(endDate);
        endOfDate.setHours(23, 59, 59, 999);
        query = query.lte("tanggal", endOfDate.toISOString());
      }
    } else {
      query = query.gte("tanggal", start.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/rekap/penjualan] Error fetching histori_stok:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data rekap penjualan.", detail: error.message },
        { status: 500 }
      );
    }

    // Format transaction rows
    const result = (data || []).map((row: any) => {
      const v = row.varian;
      const p = Array.isArray(v?.produk) ? v.produk[0] : v?.produk;
      const hargaSatuan = p?.harga || 0;
      return {
        id_histori: row.id_histori,
        tanggal: row.tanggal,
        nama_produk: p?.nama_produk || "Produk",
        nama_varian: v?.nama_varian || "Varian",
        jumlah: row.jumlah,
        harga_satuan: hargaSatuan,
        total_pendapatan: row.jumlah * hargaSatuan,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/rekap/penjualan] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
