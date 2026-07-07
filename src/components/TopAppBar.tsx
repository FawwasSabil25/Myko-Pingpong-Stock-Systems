"use client";

import { useRouter } from "next/navigation";

interface TopAppBarProps {
  title: string;
  backHref?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export default function TopAppBar({
  title,
  backHref,
  onBack,
  actions,
}: TopAppBarProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center gap-3 px-6 bg-[#F7F9FB] border-b border-[#E0E3E5]"
      style={{ height: "64px" }}
    >
      <button
        type="button"
        onClick={handleBack}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors cursor-pointer -ml-1"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00647C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      </button>

      <h1
        className="flex-1 text-2xl font-bold leading-8 truncate"
        style={{ color: "#00647C" }}
      >
        {title}
      </h1>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
