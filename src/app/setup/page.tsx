"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Role, setRole, setWhatsApp } from "@/lib/role";

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function OwnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="27"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ManagerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function validateWhatsApp(nomor: string): string | null {
  const cleaned = nomor.trim();
  if (!cleaned) return "Nomor WhatsApp wajib diisi.";
  if (!/^[\d+]+$/.test(cleaned))
    return "Nomor hanya boleh berisi angka (dan + di depan).";
  if (
    !cleaned.startsWith("08") &&
    !cleaned.startsWith("+62") &&
    !cleaned.startsWith("62")
  )
    return "Nomor harus diawali 08, +62, atau 62.";

  // Remove prefix to count digits
  let digits = cleaned.replace(/\D/g, "");
  if (digits.startsWith("62")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length < 8 || digits.length > 13)
    return "Panjang nomor tidak valid (8-13 digit setelah kode negara).";

  return null;
}

export default function SetupPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [nomorWA, setNomorWA] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
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

    // Save to localStorage via role.ts helpers
    setRole(selectedRole);
    setWhatsApp(nomorWA.trim());

    // Redirect to beranda
    router.replace("/beranda");
  }

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-white px-6 py-6">
      <div
        className="w-full max-w-[342px] bg-white rounded-xl flex flex-col gap-10 p-6"
        style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)" }}
      >
        {/* Header Section */}
        <div className="flex flex-col gap-3 items-center">
          <h1
            className="text-[30px] font-bold leading-[38px] text-center"
            style={{ color: "#00647C" }}
          >
            Selamat Datang di
            <br />
            Myko Pingpong
          </h1>
          <p
            className="text-base leading-6 text-center"
            style={{ color: "#3E484D" }}
          >
            Pilih peran Anda untuk memulai setup
            <br />
            awal sistem inventaris.
          </p>
        </div>

        {/* Role Selection Form */}
        <div className="flex flex-col gap-6">
          {/* Role Cards */}
          <div className="flex gap-4">
            {/* Pemilik Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole("pemilik");
                setError(null);
              }}
              className={`flex-1 flex flex-col items-center gap-3 py-3.5 px-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedRole === "pemilik"
                  ? "border-[#00647C] bg-[#ecfeff]/50 shadow-sm"
                  : "border-[#BDC8CE] bg-white hover:border-[#00647C]/40 hover:bg-[#ecfeff]/20"
              }`}
            >
              <OwnerIcon
                className={
                  selectedRole === "pemilik"
                    ? "text-[#00647C]"
                    : "text-[#6E797E]"
                }
              />
              <span
                className={`text-sm font-semibold leading-5 text-center ${
                  selectedRole === "pemilik"
                    ? "text-[#00647C]"
                    : "text-[#191C1E]"
                }`}
              >
                Saya Pemilik
              </span>
            </button>

            {/* Pengelola Card */}
            <button
              type="button"
              onClick={() => {
                setSelectedRole("pengelola");
                setError(null);
              }}
              className={`flex-1 flex flex-col items-center gap-3 py-3.5 px-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedRole === "pengelola"
                  ? "border-[#00647C] bg-[#ecfeff]/50 shadow-sm"
                  : "border-[#BDC8CE] bg-white hover:border-[#00647C]/40 hover:bg-[#ecfeff]/20"
              }`}
            >
              <ManagerIcon
                className={
                  selectedRole === "pengelola"
                    ? "text-[#00647C]"
                    : "text-[#6E797E]"
                }
              />
              <span
                className={`text-sm font-semibold leading-5 text-center ${
                  selectedRole === "pengelola"
                    ? "text-[#00647C]"
                    : "text-[#191C1E]"
                }`}
              >
                Saya Pengelola
              </span>
            </button>
          </div>

          {/* WhatsApp Input Section */}
          <div className="flex flex-col gap-3">
            <label
              htmlFor="nomor-wa"
              className="text-sm font-semibold leading-5"
              style={{ color: "#191C1E" }}
            >
              Nomor WhatsApp
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E797E]">
                <PhoneIcon className="w-4 h-4" />
              </div>
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
                className="w-full h-12 pl-10 pr-4 text-base bg-white border border-[#BDC8CE] rounded focus:outline-none focus:border-[#00647C] focus:ring-1 focus:ring-[#00647C]/30 transition-colors placeholder:text-[#6E797E]"
              />
            </div>
            <p className="text-sm leading-5" style={{ color: "#3E484D" }}>
              Nomor ini digunakan untuk menerima notifikasi.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <svg
                className="w-4 h-4 mt-0.5 text-red-500 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 flex items-center justify-center gap-2 rounded text-sm font-semibold text-white transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "#00647C",
              boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                Mulai Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
