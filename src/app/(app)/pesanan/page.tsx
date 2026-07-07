"use client";

export default function PesananPage() {
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
          Pesanan
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
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 18v-1" />
            <path d="M14 18v-3" />
            <path d="M10 13V9" />
            <path d="M14 13v-1" />
          </svg>
        </div>
        <p className="text-base font-semibold" style={{ color: "#191C1E" }}>
          Halaman Pesanan
        </p>
        <p className="text-sm text-center" style={{ color: "#6E797E" }}>
          Fitur kelola pesanan akan diimplementasi di Langkah 4.
          <span className="block mt-1">
            Lihat, input, dan kelola pesanan masuk.
          </span>
        </p>
      </div>
    </div>
  );
}
