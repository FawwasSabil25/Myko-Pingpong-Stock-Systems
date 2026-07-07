"use client";

export default function RekapPage() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <header
        className="flex items-center px-6 bg-white border-b border-[#F1F5F9]"
        style={{
          height: "64px",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h1
          className="text-lg font-bold leading-6"
          style={{ color: "#00647C" }}
        >
          Rekap Penjualan
        </h1>
      </header>

      {/* Placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-20">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(236, 254, 255, 0.5)" }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0891B2"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
        </div>
        <p className="text-base font-semibold" style={{ color: "#191C1E" }}>
          Halaman Rekap
        </p>
        <p className="text-sm text-center" style={{ color: "#6E797E" }}>
          Fitur rekap penjualan akan diimplementasi di Langkah 4.
          <span className="block mt-1">
            Lihat ringkasan dan statistik penjualan.
          </span>
        </p>
      </div>
    </div>
  );
}
