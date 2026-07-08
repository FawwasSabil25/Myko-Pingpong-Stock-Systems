import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface VarianBody {
  id_varian?: string;
  nama_varian: string;
  jumlah_stok: number;
  reorder_point: number;
  lokasi_penyimpanan?: string;
  _deleted?: boolean;
}

/**
 * PATCH /api/produk/[id] — ProdukController
 *
 * Memperbarui data produk (nama, kategori) dan seluruh variannya sekaligus.
 * Memproses logika:
 * - Update info produk.
 * - Hapus varian yang ditandai _deleted.
 * - Update varian lama: cek perubahan stok untuk pencatatan histori_stok (Business Rule #6)
 *   dan trigger notifikasi ROP (Business Rule #7).
 * - Tambah varian baru.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama_produk, kategori, varian } = body;

    if (!nama_produk || !nama_produk.trim()) {
      return NextResponse.json(
        { error: "Nama produk wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Update informasi dasar produk
    const { error: produkError } = await supabase
      .from("produk")
      .update({
        nama_produk: nama_produk.trim(),
        kategori: kategori ? kategori.trim() : null,
      })
      .eq("id_produk", id);

    if (produkError) {
      console.error("[PATCH /api/produk/[id]] Error updating produk:", produkError);
      return NextResponse.json(
        { error: "Gagal memperbarui data produk.", detail: produkError.message },
        { status: 500 }
      );
    }

    // 2. Proses varian
    if (Array.isArray(varian)) {
      for (const v of varian as VarianBody[]) {
        if (v._deleted && v.id_varian) {
          // A. Hapus varian
          const { error: deleteError } = await supabase
            .from("varian")
            .delete()
            .eq("id_varian", v.id_varian);

          if (deleteError) {
            console.error(`[PATCH /api/produk/[id]] Error deleting varian ${v.id_varian}:`, deleteError);
          }
        } else if (v.id_varian) {
          // B. Update varian lama
          // Ambil data lama untuk dibanding stoknya (Business Rule #6)
          const { data: oldVarian, error: fetchError } = await supabase
            .from("varian")
            .select("jumlah_stok, reorder_point")
            .eq("id_varian", v.id_varian)
            .single();

          if (fetchError || !oldVarian) {
            console.error(`[PATCH /api/produk/[id]] Error fetching varian ${v.id_varian}:`, fetchError);
            continue;
          }

          const oldStok = oldVarian.jumlah_stok;
          const newStok = v.jumlah_stok;

          // Update varian di DB
          const { error: updateError } = await supabase
            .from("varian")
            .update({
              nama_varian: v.nama_varian.trim(),
              jumlah_stok: newStok,
              reorder_point: v.reorder_point,
              lokasi_penyimpanan: v.lokasi_penyimpanan ? v.lokasi_penyimpanan.trim() : null,
            })
            .eq("id_varian", v.id_varian);

          if (updateError) {
            console.error(`[PATCH /api/produk/[id]] Error updating varian ${v.id_varian}:`, updateError);
            continue;
          }

          // Business Rule #6: Bandingkan jumlah_stok baru vs nilai lama
          if (newStok > oldStok) {
            // Bertambah -> Restok (insert histori_stok jenis 'masuk')
            const selisih = newStok - oldStok;
            const { error: historiError } = await supabase
              .from("histori_stok")
              .insert({
                id_varian: v.id_varian,
                jenis: "masuk",
                jumlah: selisih,
                id_referensi: null,
              });

            if (historiError) {
              console.error(`[PATCH /api/produk/[id]] Error inserting restok history for ${v.id_varian}:`, historiError);
            }
          }

          // Business Rule #7: Cek Reorder Point
          if (newStok !== oldStok || v.reorder_point !== oldVarian.reorder_point) {
            if (v.reorder_point > 0 && newStok <= v.reorder_point) {
              console.log(
                `[STUB UC-06] Notifikasi Stok Menipis — Varian "${v.nama_varian}" (${v.id_varian}): ` +
                `stok=${newStok}, reorder_point=${v.reorder_point}. ` +
                `Akan kirim WA ke Pemilik di Tahap 2.`
              );
            }
          }
        } else if (!v._deleted) {
          // C. Tambah varian baru
          const { data: newVarian, error: insertError } = await supabase
            .from("varian")
            .insert({
              id_produk: id,
              nama_varian: v.nama_varian.trim(),
              jumlah_stok: v.jumlah_stok,
              reorder_point: v.reorder_point,
              lokasi_penyimpanan: v.lokasi_penyimpanan ? v.lokasi_penyimpanan.trim() : null,
            })
            .select("id_varian")
            .single();

          if (insertError || !newVarian) {
            console.error("[PATCH /api/produk/[id]] Error inserting new varian:", insertError);
            continue;
          }

          // Jika stok awal varian baru > 0, catat sebagai stok masuk
          if (v.jumlah_stok > 0) {
            const { error: historiError } = await supabase
              .from("histori_stok")
              .insert({
                id_varian: newVarian.id_varian,
                jenis: "masuk",
                jumlah: v.jumlah_stok,
                id_referensi: null,
              });

            if (historiError) {
              console.error(`[PATCH /api/produk/[id]] Error inserting history for new varian ${newVarian.id_varian}:`, historiError);
            }
          }

          // Business Rule #7: Cek Reorder Point untuk varian baru
          if (v.reorder_point > 0 && v.jumlah_stok <= v.reorder_point) {
            console.log(
              `[STUB UC-06] Notifikasi Stok Menipis — Varian Baru "${v.nama_varian}" (${newVarian.id_varian}): ` +
              `stok=${v.jumlah_stok}, reorder_point=${v.reorder_point}. ` +
              `Akan kirim WA ke Pemilik di Tahap 2.`
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/produk/[id]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
