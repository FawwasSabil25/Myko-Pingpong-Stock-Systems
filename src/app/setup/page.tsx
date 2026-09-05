"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PhoneIcon,
  StoreIcon,
  UserCogIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  CheckIcon,
} from "lucide-react";
import { type Role, setRole } from "@/lib/role";
import { setPengaturan } from "@/lib/supabase";

const easing = [0.23, 1, 0.32, 1] as const;

const roleCardBase =
  "relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-sm font-bold transition-all duration-150 ease-out cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

function validateWhatsApp(nomor: string): string | null {
  const cleaned = nomor.trim();
  if (!cleaned) return "Nomor WhatsApp wajib diisi.";
  if (!/^\d+$/.test(cleaned))
    return "Nomor hanya boleh berisi angka (tanpa + atau spasi).";
  if (!cleaned.startsWith("08"))
    return "Nomor harus diawali 08 (contoh: 081234567890).";

  // Hitung panjang digit setelah prefix 0
  const digits = cleaned.slice(1); // hapus leading 0
  if (digits.length < 8 || digits.length > 13)
    return "Panjang nomor tidak valid (9-14 digit total).";

  return null;
}

export default function SetupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [nomorWA, setNomorWA] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // Validate role
    if (!selectedRole) {
      setError("Silakan pilih peran terlebih dahulu.");
      return;
    }

    // Validate WA number
    const waError = validateWhatsApp(nomorWA);
    if (waError) {
      setError(waError);
      return;
    }

    setError(null);
    setSubmitting(true);

    // Save role to localStorage (client-side only)
    setRole(selectedRole);

    // Save WhatsApp number to Supabase pengaturan table
    // Nomor disimpan apa adanya (format 08xxx) — sesuai kebutuhan Fonnte API
    const key = selectedRole === "pemilik" ? "pemilik_whatsapp" : "pengelola_whatsapp";
    try {
      await setPengaturan(key, nomorWA.trim());
    } catch {
      setError("Gagal menyimpan nomor WhatsApp. Silakan coba lagi.");
      setSubmitting(false);
      return;
    }

    // Redirect to beranda
    router.replace("/beranda");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0]">
      <main className="px-5 pb-12 pt-10 max-w-md mx-auto">
        <div className="space-y-6">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: easing }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-800 to-brand-900 p-6 text-white shadow-lift"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-b from-brand-400/40 to-transparent blur-2xl"
            />
            <div className="relative">
              <span
                aria-hidden="true"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-900 text-lg font-bold text-white shadow-lift ring-2 ring-white/50"
              >
                M
              </span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-brand-200">
                Selamat datang di
              </p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight">
                Myko Pingpong
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-brand-100">
                Pilih peran Anda untuk memulai setup awal sistem inventaris.
              </p>
            </div>
          </motion.section>

          {/* Setup Form Card */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: easing, delay: 0.08 }}
            className="rounded-3xl border border-white/70 bg-gradient-to-b from-white to-brand-50 p-5 shadow-card"
          >
            <div className="space-y-5">
              {/* Section Heading */}
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-brand-900">
                  Pilih Peran Anda
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pilih peran yang sesuai dengan tanggung jawab Anda.
                </p>
              </div>

              {/* Role Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Pemilik Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("pemilik");
                    setError(null);
                  }}
                  aria-pressed={selectedRole === "pemilik"}
                  className={`${roleCardBase} ${
                    selectedRole === "pemilik"
                      ? "border-brand-700 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white shadow-lift"
                      : "border-brand-100 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50/60"
                  }`}
                >
                  <StoreIcon
                    className={`h-7 w-7 ${
                      selectedRole === "pemilik" ? "text-white" : "text-brand-500"
                    }`}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-sm font-bold ${
                      selectedRole === "pemilik" ? "text-white" : "text-brand-900"
                    }`}
                  >
                    Saya Pemilik
                  </span>
                  {selectedRole === "pemilik" && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand-700 shadow-card">
                      <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </button>

                {/* Pengelola Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("pengelola");
                    setError(null);
                  }}
                  aria-pressed={selectedRole === "pengelola"}
                  className={`${roleCardBase} ${
                    selectedRole === "pengelola"
                      ? "border-brand-700 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white shadow-lift"
                      : "border-brand-100 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50/60"
                  }`}
                >
                  <UserCogIcon
                    className={`h-7 w-7 ${
                      selectedRole === "pengelola" ? "text-white" : "text-brand-500"
                    }`}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-sm font-bold ${
                      selectedRole === "pengelola" ? "text-white" : "text-brand-900"
                    }`}
                  >
                    Saya Pengelola
                  </span>
                  {selectedRole === "pengelola" && (
                    <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand-700 shadow-card">
                      <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </button>
              </div>

              {/* WhatsApp Input Section */}
              <label htmlFor="nomor-wa" className="block space-y-1.5">
                <span className="block text-xs font-bold text-brand-900">
                  Nomor WhatsApp
                </span>
                <span className="relative block">
                  <PhoneIcon
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-500"
                    aria-hidden="true"
                  />
                  <input
                    id="nomor-wa"
                    type="tel"
                    inputMode="tel"
                    value={nomorWA}
                    onChange={(e) => {
                      setNomorWA(e.target.value);
                      setError(null);
                    }}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-2xl border border-brand-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-brand-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                  />
                </span>
                <span className="block text-xs text-slate-500">
                  Nomor ini digunakan untuk menerima notifikasi.
                </span>
              </label>

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-2xl border border-alert-100 bg-alert-50 p-3"
                >
                  <AlertTriangleIcon
                    className="mt-0.5 h-4 w-4 shrink-0 text-alert-600"
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold text-alert-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 py-4 text-sm font-bold text-white shadow-lift transition-opacity duration-150 ease-out hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Mulai Sekarang
                    <ArrowRightIcon className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}