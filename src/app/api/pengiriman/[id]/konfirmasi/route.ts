import { NextRequest, NextResponse } from "next/server";
import { supabase, getPengaturan } from "@/lib/supabase";
import { kirimPesanWA } from "@/lib/fonnte";
import { templateStokMenipis, templatePengirimanSelesai } from "@/lib/waTemplates";

/**
 * POST /api/pengiriman/[id]/konfirmasi
 *
 * Menangani konfirmasi pengiriman pesanan (UC-11) oleh Pengelola.
 * Melakukan 3 operasi berurutan (Business Rule #5):
 * 1. Validasi kecukupan stok varian.
 * 2. Kurangi jumlah_stok pada tabel varian untuk setiap item pesanan.
 * 3. Tambahkan catatan ke histori_stok dengan jenis = 'keluar' dan id_referensi = id_pesanan.
 * 4. Update status pesanan di tabel pesanan menjadi 'dikirim'.
 * 5. Kirim notifikasi WhatsApp ke Pemilik (UC-12).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Ambil data pesanan
    const { data: pesanan, error: orderError } = await supabase
      .from("pesanan")
      .select("id_pesanan, status, platform, no_pesanan, nama_pelanggan, metode_pengiriman, resi_url")
      .eq("id_pesanan", id)
      .single();

    if (orderError || !pesanan) {
      console.error(`[POST /api/pengiriman/[id]/konfirmasi] Order not found:`, orderError);
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (pesanan.status === "dikirim") {
      return NextResponse.json(
        { error: "Pesanan sudah dikonfirmasi terkirim sebelumnya." },
        { status: 400 }
      );
    }

    // 2. Ambil detail pesanan beserta varian dan produk
    const { data: details, error: detailsError } = await supabase
      .from("detail_pesanan")
      .select(`
        id_detail,
        id_varian,
        jumlah,
        varian (
          id_varian,
          nama_varian,
          jumlah_stok,
          reorder_point,
          produk (
            nama_produk
          )
        )
      `)
      .eq("id_pesanan", id);

    if (detailsError || !details || details.length === 0) {
      console.error(`[POST /api/pengiriman/[id]/konfirmasi] Details fetch error:`, detailsError);
      return NextResponse.json(
        { error: "Detail pesanan tidak ditemukan atau gagal dimuat." },
        { status: 500 }
      );
    }

    // 3. Validasi stok sebelum melakukan update
    for (const detail of details) {
      const v: any = detail.varian;
      if (!v) {
        return NextResponse.json(
          { error: "Salah satu varian pesanan tidak ditemukan." },
          { status: 400 }
        );
      }
      if (v.jumlah_stok < detail.jumlah) {
        const prod = Array.isArray(v.produk) ? v.produk[0] : v.produk;
        return NextResponse.json(
          {
            error: `Stok tidak mencukupi untuk melakukan konfirmasi pengiriman: ${
              prod?.nama_produk || "Produk"
            } (${v.nama_varian}). Tersedia: ${v.jumlah_stok} pcs, Butuh: ${detail.jumlah} pcs.`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Jalankan 3 operasi sequential (Business Rule #5)
    // Ambil nomor WA Pemilik sekali untuk digunakan di seluruh loop
    const pemilikWa = await getPengaturan("pemilik_whatsapp");
    console.log("[UC-12] Nomor pemilik dari DB:", pemilikWa);
    for (const detail of details) {
      const v: any = detail.varian;

      // a. Kurangi stok varian
      const newStock = v.jumlah_stok - detail.jumlah;
      const { error: updateStockError } = await supabase
        .from("varian")
        .update({ jumlah_stok: newStock })
        .eq("id_varian", detail.id_varian);

      if (updateStockError) {
        console.error(
          `[POST /api/pengiriman/[id]/konfirmasi] Error decrementing stock for ${detail.id_varian}:`,
          updateStockError
        );
        return NextResponse.json(
          { error: "Gagal memperbarui stok barang.", detail: updateStockError.message },
          { status: 500 }
        );
      }

      // Business Rule #7: Cek Reorder Point setelah stok dikurangi
      if (v.reorder_point > 0 && newStock <= v.reorder_point) {
        if (pemilikWa) {
          const prod = Array.isArray(v.produk) ? v.produk[0] : v.produk;
          const message = templateStokMenipis({
            namaProduk: prod?.nama_produk || "Produk",
            namaVarian: v.nama_varian,
            jumlahStok: newStock,
            reorderPoint: v.reorder_point,
          });
          try {
            const res = await kirimPesanWA({
              target: pemilikWa,
              message,
            });
            console.log(`[WA ROP Notice to Pemilik (Pengiriman)] Varian "${v.nama_varian}":`, res);
          } catch (err) {
            console.error("Fonnte WA delivery error (ROP Check):", err);
          }
        }
      }

      // b. Catat histori pergerakan stok keluar
      const { error: insertHistoryError } = await supabase
        .from("histori_stok")
        .insert({
          id_varian: detail.id_varian,
          jenis: "keluar",
          jumlah: detail.jumlah,
          id_referensi: id,
        });

      if (insertHistoryError) {
        console.error(
          `[POST /api/pengiriman/[id]/konfirmasi] Error inserting histori_stok:`,
          insertHistoryError
        );
        // Rollback stok (manual recovery)
        await supabase
          .from("varian")
          .update({ jumlah_stok: v.jumlah_stok })
          .eq("id_varian", detail.id_varian);

        return NextResponse.json(
          { error: "Gagal mencatat riwayat pergerakan stok.", detail: insertHistoryError.message },
          { status: 500 }
        );
      }
    }

    // c. Update status pesanan di tabel pesanan menjadi 'dikirim'
    const { error: updateStatusError } = await supabase
      .from("pesanan")
      .update({ status: "dikirim" })
      .eq("id_pesanan", id);

    if (updateStatusError) {
      console.error(
        `[POST /api/pengiriman/[id]/konfirmasi] Error updating order status:`,
        updateStatusError
      );
      return NextResponse.json(
        { error: "Gagal memperbarui status pengiriman pesanan.", detail: updateStatusError.message },
        { status: 500 }
      );
    }

    let waResult: any = null;

    // 5. Kirim notifikasi WhatsApp ke Pemilik (UC-12)
    if (pemilikWa) {
      const templateItems = details.map((detail) => {
        const v: any = detail.varian;
        const prod = Array.isArray(v.produk) ? v.produk[0] : v.produk;
        return {
          namaProduk: prod?.nama_produk || "Produk",
          namaVarian: v.nama_varian,
          jumlah: detail.jumlah,
        };
      });

      const message = templatePengirimanSelesai(templateItems);

      console.log("[UC-12] Mengirim notifikasi pengiriman selesai ke Pemilik:", pemilikWa);
      // Await pengiriman agar aman di Vercel (Serverless), dibungkus try/catch agar tidak membatalkan transaksi utama
      try {
        waResult = await kirimPesanWA({
          target: pemilikWa,
          message,
        });
        console.log("[WA Delivery Result to Pemilik (Pengiriman Selesai)]:", waResult);
      } catch (err) {
        console.error("Fonnte WA delivery error (Pengiriman Selesai):", err);
        waResult = { success: false, message: String(err) };
      }
    } else {
      console.warn("Nomor WhatsApp Pemilik belum diatur di tabel pengaturan.");
      waResult = { success: false, message: "Nomor WhatsApp Pemilik belum diatur" };
    }

    return NextResponse.json({
      success: true,
      message: "Konfirmasi pengiriman berhasil diproses.",
      wa_notif: waResult, // Memberi tahu status pengiriman notifikasi ke frontend
    });
  } catch (error: any) {
    console.error("[POST /api/pengiriman/[id]/konfirmasi] Internal server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
