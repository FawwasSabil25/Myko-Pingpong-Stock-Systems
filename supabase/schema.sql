-- ============================================================
-- Schema Database: Sistem Manajemen Stok Myko Pingpong
-- Sesuai PRD Bagian 4 (Data Model)
-- ============================================================
-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- Pastikan menjalankan SEBELUM seed.sql
-- ============================================================

-- 1. Tabel produk
CREATE TABLE IF NOT EXISTS produk (
  id_produk UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_produk TEXT NOT NULL,
  kategori TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel varian
CREATE TABLE IF NOT EXISTS varian (
  id_varian UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_produk UUID NOT NULL REFERENCES produk(id_produk) ON DELETE CASCADE,
  nama_varian TEXT NOT NULL,
  jumlah_stok INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_stok >= 0),
  reorder_point INTEGER NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel pesanan
CREATE TABLE IF NOT EXISTS pesanan (
  id_pesanan UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal_input TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN ('baru', 'dikirim')),
  resi_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel detail_pesanan
CREATE TABLE IF NOT EXISTS detail_pesanan (
  id_detail UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pesanan UUID NOT NULL REFERENCES pesanan(id_pesanan) ON DELETE CASCADE,
  id_varian UUID NOT NULL REFERENCES varian(id_varian),
  jumlah INTEGER NOT NULL CHECK (jumlah > 0)
);

-- 5. Tabel histori_stok
CREATE TABLE IF NOT EXISTS histori_stok (
  id_histori UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_varian UUID NOT NULL REFERENCES varian(id_varian),
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  jumlah INTEGER NOT NULL CHECK (jumlah > 0),
  tanggal TIMESTAMPTZ DEFAULT now(),
  id_referensi TEXT
);

-- ============================================================
-- Indexes untuk performa query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_varian_produk ON varian(id_produk);
CREATE INDEX IF NOT EXISTS idx_detail_pesanan_pesanan ON detail_pesanan(id_pesanan);
CREATE INDEX IF NOT EXISTS idx_detail_pesanan_varian ON detail_pesanan(id_varian);
CREATE INDEX IF NOT EXISTS idx_histori_stok_varian ON histori_stok(id_varian);
CREATE INDEX IF NOT EXISTS idx_histori_stok_tanggal ON histori_stok(tanggal);
CREATE INDEX IF NOT EXISTS idx_pesanan_status ON pesanan(status);

-- ============================================================
-- Trigger: auto-update updated_at pada produk dan varian
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_produk_updated_at
  BEFORE UPDATE ON produk
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_varian_updated_at
  BEFORE UPDATE ON varian
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) — disabled untuk prototype
-- Supabase mengaktifkan RLS by default, kita disable agar
-- client-side Supabase bisa CRUD tanpa auth
-- ============================================================
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE varian ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_pesanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE histori_stok ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations for anon (prototype only)
CREATE POLICY "Allow all for anon" ON produk FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON varian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON pesanan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON detail_pesanan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON histori_stok FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
2. Storage Bucket 'resi' Setup and Policies
-- ============================================================
-- Membuat bucket 'resi' jika belum ada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resi', 'resi', true, null, '{"application/pdf"}')
ON CONFLICT (id) DO NOTHING;

-- Kebijakan RLS untuk upload dan download resi (anonim)
CREATE POLICY "Allow public select on resi bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'resi');

CREATE POLICY "Allow anon insert on resi bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'resi');

CREATE POLICY "Allow anon update on resi bucket" ON storage.objects
  FOR UPDATE USING (bucket_id = 'resi') WITH CHECK (bucket_id = 'resi');

CREATE POLICY "Allow anon delete on resi bucket" ON storage.objects
  FOR DELETE USING (bucket_id = 'resi');

