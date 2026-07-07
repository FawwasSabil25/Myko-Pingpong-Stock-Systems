-- ============================================================
-- Seed Data: Produk, Varian, dan Histori Stok Awal
-- Sistem Manajemen Stok Myko Pingpong
-- ============================================================
-- Jalankan SQL ini di Supabase SQL Editor SETELAH schema.sql
-- ============================================================

-- Menggunakan UUID eksplisit agar relasi antar tabel konsisten

-- ============================================================
-- PRODUK (5 produk tenis meja)
-- ============================================================

INSERT INTO produk (id_produk, nama_produk, kategori) VALUES
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Bat Pingpong Yinhe T-11s', 'Bat'),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Bola Nittaku 3-Star', 'Bola'),
  ('a1b2c3d4-3333-4000-8000-000000000003', 'Rubber DHS Hurricane 3', 'Rubber'),
  ('a1b2c3d4-4444-4000-8000-000000000004', 'Meja Pingpong Cornilleau 500M', 'Meja'),
  ('a1b2c3d4-5555-4000-8000-000000000005', 'Kaos Myko Pingpong', 'Apparel');

-- ============================================================
-- VARIAN (11 varian total, 2-3 per produk)
-- ============================================================

INSERT INTO varian (id_varian, id_produk, nama_varian, jumlah_stok, reorder_point) VALUES
  -- Bat Pingpong Yinhe T-11s
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', 'Karet Polos', 15, 5),
  ('b1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-1111-4000-8000-000000000001', 'Karet Bintik', 10, 5),

  -- Bola Nittaku 3-Star
  ('b1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-2222-4000-8000-000000000002', 'Putih (isi 3)', 25, 8),
  ('b1b2c3d4-0004-4000-8000-000000000004', 'a1b2c3d4-2222-4000-8000-000000000002', 'Orange (isi 3)', 20, 8),

  -- Rubber DHS Hurricane 3
  ('b1b2c3d4-0005-4000-8000-000000000005', 'a1b2c3d4-3333-4000-8000-000000000003', 'Merah 2.2mm', 12, 3),
  ('b1b2c3d4-0006-4000-8000-000000000006', 'a1b2c3d4-3333-4000-8000-000000000003', 'Hitam 2.2mm', 8, 3),

  -- Meja Pingpong Cornilleau 500M
  ('b1b2c3d4-0007-4000-8000-000000000007', 'a1b2c3d4-4444-4000-8000-000000000004', 'Biru', 2, 1),
  ('b1b2c3d4-0008-4000-8000-000000000008', 'a1b2c3d4-4444-4000-8000-000000000004', 'Hijau', 1, 1),

  -- Kaos Myko Pingpong
  ('b1b2c3d4-0009-4000-8000-000000000009', 'a1b2c3d4-5555-4000-8000-000000000005', 'Ukuran M', 20, 5),
  ('b1b2c3d4-000a-4000-8000-00000000000a', 'a1b2c3d4-5555-4000-8000-000000000005', 'Ukuran L', 18, 5),
  ('b1b2c3d4-000b-4000-8000-00000000000b', 'a1b2c3d4-5555-4000-8000-000000000005', 'Ukuran XL', 12, 5);

-- ============================================================
-- HISTORI STOK AWAL (jenis: 'masuk' — stok awal per varian)
-- ============================================================

INSERT INTO histori_stok (id_varian, jenis, jumlah, tanggal, id_referensi) VALUES
  -- Bat Pingpong Yinhe T-11s
  ('b1b2c3d4-0001-4000-8000-000000000001', 'masuk', 15, now() - interval '7 days', 'Stok awal'),
  ('b1b2c3d4-0002-4000-8000-000000000002', 'masuk', 10, now() - interval '7 days', 'Stok awal'),

  -- Bola Nittaku 3-Star
  ('b1b2c3d4-0003-4000-8000-000000000003', 'masuk', 25, now() - interval '6 days', 'Stok awal'),
  ('b1b2c3d4-0004-4000-8000-000000000004', 'masuk', 20, now() - interval '6 days', 'Stok awal'),

  -- Rubber DHS Hurricane 3
  ('b1b2c3d4-0005-4000-8000-000000000005', 'masuk', 12, now() - interval '5 days', 'Stok awal'),
  ('b1b2c3d4-0006-4000-8000-000000000006', 'masuk', 8, now() - interval '5 days', 'Stok awal'),

  -- Meja Pingpong Cornilleau 500M
  ('b1b2c3d4-0007-4000-8000-000000000007', 'masuk', 2, now() - interval '4 days', 'Stok awal'),
  ('b1b2c3d4-0008-4000-8000-000000000008', 'masuk', 1, now() - interval '4 days', 'Stok awal'),

  -- Kaos Myko Pingpong
  ('b1b2c3d4-0009-4000-8000-000000000009', 'masuk', 20, now() - interval '3 days', 'Stok awal'),
  ('b1b2c3d4-000a-4000-8000-00000000000a', 'masuk', 18, now() - interval '3 days', 'Stok awal'),
  ('b1b2c3d4-000b-4000-8000-00000000000b', 'masuk', 12, now() - interval '3 days', 'Stok awal');

-- ============================================================
-- PESANAN CONTOH (1 pesanan dengan status 'dikirim', 1 pesanan 'baru')
-- Untuk memastikan ada data di halaman daftar pesanan
-- ============================================================

INSERT INTO pesanan (id_pesanan, tanggal_input, status) VALUES
  ('c1c2c3d4-0001-4000-8000-000000000001', now() - interval '2 days', 'dikirim'),
  ('c1c2c3d4-0002-4000-8000-000000000002', now() - interval '1 day', 'baru');

INSERT INTO detail_pesanan (id_pesanan, id_varian, jumlah) VALUES
  -- Pesanan 1 (dikirim): 2x Bola Nittaku Putih, 1x Rubber DHS Merah
  ('c1c2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000003', 2),
  ('c1c2c3d4-0001-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000005', 1),

  -- Pesanan 2 (baru): 1x Kaos M, 1x Kaos L
  ('c1c2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-0009-4000-8000-000000000009', 1),
  ('c1c2c3d4-0002-4000-8000-000000000002', 'b1b2c3d4-000a-4000-8000-00000000000a', 1);

-- Histori stok keluar untuk pesanan 1 yang sudah dikirim
INSERT INTO histori_stok (id_varian, jenis, jumlah, tanggal, id_referensi) VALUES
  ('b1b2c3d4-0003-4000-8000-000000000003', 'keluar', 2, now() - interval '2 days', 'c1c2c3d4-0001-4000-8000-000000000001'),
  ('b1b2c3d4-0005-4000-8000-000000000005', 'keluar', 1, now() - interval '2 days', 'c1c2c3d4-0001-4000-8000-000000000001');
