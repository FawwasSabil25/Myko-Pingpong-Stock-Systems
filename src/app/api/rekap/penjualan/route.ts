import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/rekap/penjualan
 *
 * Mengambil data histori_stok dengan jenis = 'keluar' (penjualan) dalam periode tertentu.
 * Melakukan agregasi jumlah terjual per varian produk.
 *
 * Query params:
 * - periode: 'today' | 'week' | 'month' | 'custom'
 * - startDate: ISO String (diperlukan jika periode='custom')
 * - endDate: ISO String (diperlukan jika periode='custom')
 * - sort: 'produk' | 'terjual' (default: 'terjual')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "terjual";

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
      // default: month (30 hari terakhir)
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
            nama_produk
          )
        )
      `)
      .eq("jenis", "keluar");

    if (periode === "custom") {
      if (startDate && startDate.trim() !== "") {
        query = query.gte("tanggal", start.toISOString());
      }
      if (endDate && endDate.trim() !== "") {
        // Pastikan mencakup akhir hari tersebut
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

    // Agregasi jumlah unit terjual per varian
    const map = new Map<string, any>();
    for (const rawRow of data || []) {
      const row = rawRow as any;
      const v = row.varian;
      // Tangani jika produk terinferensi sebagai array atau object
      const p = Array.isArray(v.produk) ? v.produk[0] : v.produk;
      const key = v.id_varian;
      if (!map.has(key)) {
        map.set(key, {
          id_varian: key,
          nama_produk: p?.nama_produk || "Produk",
          nama_varian: v.nama_varian,
          total_terjual: 0,
        });
      }
      map.get(key).total_terjual += row.jumlah;
    }

    let result = Array.from(map.values());

    // Pengurutan
    if (sort === "produk") {
      // Berdasarkan Nama Produk, lalu Nama Varian
      result.sort((a, b) =>
        a.nama_produk.localeCompare(b.nama_produk) ||
        a.nama_varian.localeCompare(b.nama_varian)
      );
    } else {
      // default: terjual (paling banyak di atas)
      result.sort((a, b) => b.total_terjual - a.total_terjual);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/rekap/penjualan] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
