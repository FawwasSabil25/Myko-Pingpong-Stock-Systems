import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Mengambil nilai konfigurasi dari tabel pengaturan berdasarkan key.
 * Return null jika key tidak ditemukan (tidak throw error).
 */
export async function getPengaturan(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("pengaturan")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) {
    if (error && error.code !== "PGRST116") {
      // PGRST116 = "no rows returned" — bukan error sesungguhnya
      console.warn(`[getPengaturan] Gagal membaca key "${key}":`, error.message);
    }
    return null;
  }

  return data.value;
}

/**
 * Menyimpan/memperbarui nilai konfigurasi di tabel pengaturan.
 * Menggunakan upsert: insert jika belum ada, update jika sudah ada.
 */
export async function setPengaturan(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from("pengaturan")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    console.error(`[setPengaturan] Gagal menyimpan key "${key}":`, error.message);
    throw error;
  }
}
