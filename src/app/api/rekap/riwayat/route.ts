import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/rekap/riwayat
 *
 * Mengambil data histori_stok dengan filter opsional:
 * - id_produk: ID produk tertentu
 * - startDate: Batas awal tanggal (ISO String)
 * - endDate: Batas akhir tanggal (ISO String)
 *
 * Mengembalikan array histori_stok beserta varian dan produk.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_produk = searchParams.get("id_produk");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = supabase
      .from("histori_stok")
      .select(`
        id_histori,
        jenis,
        jumlah,
        tanggal,
        id_referensi,
        varian!inner (
          id_varian,
          nama_varian,
          id_produk,
          produk!inner (
            id_produk,
            nama_produk
          )
        )
      `);

    if (id_produk && id_produk.trim() !== "") {
      query = query.eq("varian.id_produk", id_produk);
    }
    if (startDate && startDate.trim() !== "") {
      query = query.gte("tanggal", startDate);
    }
    if (endDate && endDate.trim() !== "") {
      query = query.lte("tanggal", endDate);
    }

    query = query.order("tanggal", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/rekap/riwayat] Error fetching histori_stok:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data riwayat pergerakan stok.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("[GET /api/rekap/riwayat] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
