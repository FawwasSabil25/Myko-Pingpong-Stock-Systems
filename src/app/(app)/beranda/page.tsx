"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, getWhatsApp, clearAll, type Role } from "@/lib/role";

export default function BerandaPage() {
  const router = useRouter();
  const [role, setRoleState] = useState<Role | null>(null);
  const [wa, setWa] = useState<string | null>(null);

  useEffect(() => {
    const r = getRole();
    if (!r) {
      router.replace("/setup");
      return;
    }
    setRoleState(r);
    setWa(getWhatsApp());
  }, [router]);

  function handleReset() {
    clearAll();
    router.replace("/setup");
  }

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = role === "pemilik" ? "Pemilik" : "Pengelola";
  const greeting = role === "pemilik" ? "Wylyem" : "Erwina";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 bg-white border-b border-[#F1F5F9]"
        style={{
          height: "64px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div>
          <h1
            className="text-lg font-bold leading-6"
            style={{ color: "#00647C" }}
          >
            Myko Pingpong
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: "rgba(236, 254, 255, 0.5)",
              color: "#0891B2",
            }}
          >
            {roleLabel}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* Welcome Card */}
        <div
          className="bg-white rounded-xl p-6 flex flex-col gap-4"
          style={{ boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: "#00647C" }}
            >
              {greeting[0]}
            </div>
            <div>
              <p
                className="text-lg font-bold leading-6"
                style={{ color: "#191C1E" }}
              >
                Halo, {greeting}! 👋
              </p>
              <p className="text-sm" style={{ color: "#3E484D" }}>
                Selamat datang di sistem inventaris
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#F1F5F9]">
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: "#6E797E" }}>Peran:</span>
              <span className="font-medium" style={{ color: "#191C1E" }}>
                {roleLabel}
              </span>
            </div>
            {wa && (
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: "#6E797E" }}>WhatsApp:</span>
                <span className="font-medium" style={{ color: "#191C1E" }}>
                  {wa}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder content */}
        <div
          className="bg-[#F7F9FB] rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center"
          style={{ minHeight: "200px" }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#BDC8CE"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "#6E797E" }}>
            Dashboard {roleLabel}
          </p>
          <p className="text-xs" style={{ color: "#94A3B8" }}>
            Konten beranda akan diimplementasi di Langkah 4
          </p>
        </div>

        {/* Reset Role Button */}
        <button
          type="button"
          onClick={handleReset}
          className="self-center flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-[#BDC8CE] text-[#6E797E] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset Role
        </button>
      </div>
    </div>
  );
}
