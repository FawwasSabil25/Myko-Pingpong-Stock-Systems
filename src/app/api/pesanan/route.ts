import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/pesanan
 *
 * Mengambil daftar pesanan aktif (status = 'baru').
 * Melakukan join ke detail_pesanan, varian, dan produk untuk ringkasan.
 * Memuat kolom-kolom baru: platform, no_pesanan, nama_pelanggan, metode_pengiriman, catatan.
 */
export async function GET(request: NextRequest) {
  try {
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
      .eq("status", "baru")
      .order("tanggal_input", { ascending: false });

    if (error) {
      console.error("[GET /api/pesanan] Error fetching pesanan:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data pesanan.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[GET /api/pesanan] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pesanan
 *
 * Menerima detail pesanan lengkap beserta array item + resi_url opsional.
 * Melakukan validasi field wajib (Business Rule #10).
 * Melakukan validasi stok server-side (Business Rule #4).
 * Memasukkan pesanan ke tabel `pesanan` dan baris-baris ke `detail_pesanan`.
 * Kondisional: Menampilkan console.log STUB notifikasi WA ke Pengelola jika kirim_notifikasi = true.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      resi_url,
      platform,
      no_pesanan,
      nama_pelanggan,
      metode_pengiriman,
      catatan,
      kirim_notifikasi,
    } = body;

    // 1. Validasi field wajib (Business Rule #10)
    if (!platform || !platform.trim()) {
      return NextResponse.json({ error: "Platform/Sumber pesanan wajib diisi." }, { status: 400 });
    }
    if (!nama_pelanggan || !nama_pelanggan.trim()) {
      return NextResponse.json({ error: "Nama pelanggan wajib diisi." }, { status: 400 });
    }
    if (!metode_pengiriman || !metode_pengiriman.trim()) {
      return NextResponse.json({ error: "Metode pengiriman wajib diisi." }, { status: 400 });
    }

    // 2. Validasi input array item
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Pesanan harus memiliki minimal 1 item." },
        { status: 400 }
      );
    }

    // 3. Validasi stok server-side (Business Rule #4)
    const variantIds = items.map((item: any) => item.id_varian);
    
    // Ambil data stok varian terbaru beserta produknya
    const { data: variantsData, error: fetchError } = await supabase
      .from("varian")
      .select(`
        id_varian,
        nama_varian,
        jumlah_stok,
        produk (
          nama_produk
        )
      `)
      .in("id_varian", variantIds);

    if (fetchError || !variantsData) {
      console.error("[POST /api/pesanan] Error fetching variant stocks:", fetchError);
      return NextResponse.json(
        { error: "Gagal memverifikasi ketersediaan stok varian.", detail: fetchError?.message },
        { status: 500 }
      );
    }

    const variantsMap = new Map(variantsData.map((v: any) => [v.id_varian, v]));
    const insufficientStockItems: any[] = [];

    for (const item of items) {
      const dbVariant: any = variantsMap.get(item.id_varian);
      if (!dbVariant) {
        return NextResponse.json(
          { error: `Varian dengan ID ${item.id_varian} tidak ditemukan.` },
          { status: 400 }
        );
      }

      if (dbVariant.jumlah_stok < item.jumlah) {
        insufficientStockItems.push({
          id_varian: item.id_varian,
          nama_produk: dbVariant.produk.nama_produk,
          nama_varian: dbVariant.nama_varian,
          jumlah_stok: dbVariant.jumlah_stok,
          jumlah_dipesan: item.jumlah,
        });
      }
    }

    if (insufficientStockItems.length > 0) {
      return NextResponse.json(
        {
          error: "Stok tidak mencukupi untuk beberapa item.",
          details: insufficientStockItems,
        },
        { status: 400 }
      );
    }

    // 4. Simpan Pesanan ke Database
    // a. Insert ke tabel pesanan
    const { data: pesananData, error: pesananError } = await supabase
      .from("pesanan")
      .insert({
        status: "baru",
        platform: platform.trim(),
        no_pesanan: no_pesanan && no_pesanan.trim() !== "" ? no_pesanan.trim() : null,
        nama_pelanggan: nama_pelanggan.trim(),
        metode_pengiriman: metode_pengiriman.trim(),
        catatan: catatan && catatan.trim() !== "" ? catatan.trim() : null,
        resi_url: resi_url || null,
      })
      .select()
      .single();

    if (pesananError || !pesananData) {
      console.error("[POST /api/pesanan] Error inserting pesanan:", pesananError);
      return NextResponse.json(
        { error: "Gagal menyimpan pesanan baru.", detail: pesananError?.message },
        { status: 500 }
      );
    }

    const newPesananId = pesananData.id_pesanan;

    // b. Insert ke detail_pesanan
    const detailRows = items.map((item: any) => ({
      id_pesanan: newPesananId,
      id_varian: item.id_varian,
      jumlah: item.jumlah,
    }));

    const { data: detailData, error: detailError } = await supabase
      .from("detail_pesanan")
      .insert(detailRows)
      .select(`
        id_detail,
        jumlah,
        varian (
          id_varian,
          nama_varian,
          produk (
            nama_produk
          )
        )
      `);

    if (detailError) {
      console.error("[POST /api/pesanan] Error inserting detail_pesanan:", detailError);
      // Hapus pesanan yang terlanjur dibuat untuk menjaga konsistensi
      await supabase.from("pesanan").delete().eq("id_pesanan", newPesananId);

      return NextResponse.json(
        { error: "Gagal menyimpan detail pesanan.", detail: detailError.message },
        { status: 500 }
      );
    }

    // 5. Panggil Notifikasi ke Pengelola (UC-09) jika kirim_notifikasi === true
    if (kirim_notifikasi === true) {
      // Format list barang untuk notifikasi
      const orderItemsText = detailData
        .map((d: any) => `- ${d.varian.produk.nama_produk} (${d.varian.nama_varian}) x${d.jumlah}`)
        .join("\n");

      const stubMessage = `📦 *Pesanan Baru Masuk*\n\nAda pesanan yang perlu dikemas:\n${orderItemsText}\n\nPelanggan: ${nama_pelanggan.trim()}\nPlatform: ${platform.trim()}\nPengiriman: ${metode_pengiriman.trim()}\n\nSilakan buka aplikasi untuk melihat detail pesanan.${
        resi_url ? `\n\n[Lampiran Resi PDF]: ${resi_url}` : ""
      }`;

      console.log("[WA STUB] kirim ke Pengelola:", stubMessage);
    } else {
      console.log("[WA STUB SKIP] Pesanan disimpan tanpa kirim notifikasi WA.");
    }

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil ditambahkan.",
      pesanan: pesananData,
      detail: detailData,
    });
  } catch (error: any) {
    console.error("[POST /api/pesanan] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
