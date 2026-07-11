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
            lokasi_penyimpanan,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      platform,
      no_pesanan,
      nama_pelanggan,
      metode_pengiriman,
      catatan,
      resi_url,
      items, // array of { id_varian, jumlah }
    } = body;

    if (!platform || !nama_pelanggan || !metode_pengiriman || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Parameter platform, nama_pelanggan, metode_pengiriman, dan items wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Validasi stok untuk varian baru/updated
    for (const item of items) {
      const { data: varData, error: varError } = await supabase
        .from("varian")
        .select("nama_varian, jumlah_stok")
        .eq("id_varian", item.id_varian)
        .single();

      if (varError || !varData) {
        return NextResponse.json(
          { error: `Varian dengan ID ${item.id_varian} tidak ditemukan.` },
          { status: 400 }
        );
      }

      if (varData.jumlah_stok < item.jumlah) {
        return NextResponse.json(
          { error: `Stok untuk varian '${varData.nama_varian}' tidak mencukupi (Tersedia: ${varData.jumlah_stok} pcs, diminta: ${item.jumlah} pcs).` },
          { status: 400 }
        );
      }
    }

    // 2. Update pesanan
    const { error: orderError } = await supabase
      .from("pesanan")
      .update({
        platform: platform.trim(),
        no_pesanan: no_pesanan ? no_pesanan.trim() : null,
        nama_pelanggan: nama_pelanggan.trim(),
        metode_pengiriman: metode_pengiriman.trim(),
        catatan: catatan ? catatan.trim() : null,
        resi_url: resi_url !== undefined ? resi_url : undefined, // only update if provided
      })
      .eq("id_pesanan", id);

    if (orderError) {
      console.error(`[PATCH /api/pesanan/[id]] Error updating order:`, orderError);
      return NextResponse.json(
        { error: "Gagal memperbarui pesanan.", detail: orderError.message },
        { status: 500 }
      );
    }

    // 3. Hapus detail pesanan lama
    const { error: deleteError } = await supabase
      .from("detail_pesanan")
      .delete()
      .eq("id_pesanan", id);

    if (deleteError) {
      console.error(`[PATCH /api/pesanan/[id]] Error deleting old items:`, deleteError);
      return NextResponse.json(
        { error: "Gagal memperbarui item pesanan.", detail: deleteError.message },
        { status: 500 }
      );
    }

    // 4. Insert detail pesanan baru
    const detailRows = items.map((item) => ({
      id_pesanan: id,
      id_varian: item.id_varian,
      jumlah: item.jumlah,
    }));

    const { error: insertError } = await supabase
      .from("detail_pesanan")
      .insert(detailRows);

    if (insertError) {
      console.error(`[PATCH /api/pesanan/[id]] Error inserting new items:`, insertError);
      return NextResponse.json(
        { error: "Gagal menyimpan item pesanan baru.", detail: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Pesanan berhasil diperbarui." });
  } catch (error: any) {
    console.error("[PATCH /api/pesanan/[id]] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
