import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/pesanan/[id]
 *
 * Mengambil detail pesanan berdasarkan ID pesanan.
 * Melakukan join ke detail_pesanan, varian, dan produk.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("pesanan")
      .select(`
        id_pesanan,
        tanggal_input,
        status,
        resi_url,
        created_at,
        platform,
        no_pesanan,
        nama_pelanggan,
        metode_pengiriman,
        catatan,
        detail_pesanan (
          id_detail,
          id_pesanan,
          id_varian,
          jumlah,
          varian (
            id_varian,
            nama_varian,
            jumlah_stok,
            reorder_point,
            produk (
              id_produk,
              nama_produk,
              kategori
            )
          )
        )
      `)
      .eq("id_pesanan", id)
      .single();

    if (error) {
      console.error(`[GET /api/pesanan/[id]] Error fetching order details:`, error);
      return NextResponse.json(
        { error: "Gagal mengambil detail pesanan.", detail: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[GET /api/pesanan/[id]] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
