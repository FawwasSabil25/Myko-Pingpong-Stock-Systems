/**
 * Template pesan WhatsApp sesuai PRD Bagian 8.
 * Fungsi-fungsi ini menyusun isi pesan secara dinamis di backend.
 */

interface ItemPesanan {
  namaProduk: string;
  namaVarian: string;
  jumlah: number;
}

/**
 * Notifikasi Stok Menipis (ke Pemilik — UC-06)
 */
export function templateStokMenipis(params: {
  namaProduk: string;
  namaVarian: string;
  jumlahStok: number;
  reorderPoint: number;
}): string {
  return `⚠️ *Peringatan Stok Menipis*

Produk: ${params.namaProduk} - ${params.namaVarian}
Stok saat ini: ${params.jumlahStok}
Batas Reorder Point: ${params.reorderPoint}

Segera lakukan Restok agar stok tidak habis.`;
}

/**
 * Notifikasi Pesanan Baru (ke Pengelola — UC-09)
 */
export function templatePesananBaru(items: ItemPesanan[]): string {
  const daftar = items
    .map((item) => `- ${item.namaProduk} (${item.namaVarian}) x${item.jumlah}`)
    .join("\n");

  return `📦 *Pesanan Baru Masuk*

Ada pesanan yang perlu dikemas:
${daftar}

Silakan buka aplikasi untuk melihat detail pesanan.`;
}

/**
 * Notifikasi Pengiriman Selesai (ke Pemilik — UC-12)
 */
export function templatePengirimanSelesai(items: ItemPesanan[]): string {
  const daftar = items
    .map((item) => `- ${item.namaProduk} (${item.namaVarian}) x${item.jumlah}`)
    .join("\n");

  return `✅ *Pesanan Telah Dikirim*

Pesanan berikut telah dikemas dan diserahkan ke ekspedisi oleh Pengelola:
${daftar}

Stok telah otomatis diperbarui di sistem.`;
}
