-- ============================================================
-- Migration: Tabel pengaturan (key-value config)
-- Menyimpan konfigurasi aplikasi seperti nomor WhatsApp
-- ============================================================
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS pengaturan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pada key untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_pengaturan_key ON pengaturan(key);

-- Trigger auto-update updated_at (reuse fungsi existing)
CREATE OR REPLACE TRIGGER trg_pengaturan_updated_at
  BEFORE UPDATE ON pengaturan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS — disabled untuk prototype (sama seperti tabel lain)
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON pengaturan FOR ALL USING (true) WITH CHECK (true);
