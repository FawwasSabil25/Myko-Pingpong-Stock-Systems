"use client";

import React from "react";
import { LogOutIcon } from "lucide-react";
import { clearAll } from "@/lib/role";
import { useRouter } from "next/navigation";

type AppHeaderProps = {
  storeName: string;
  initial: string;
  onLogout?: () => void;
};

export function AppHeader({
  storeName,
  initial,
  onLogout
}: AppHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAll();
      router.replace("/setup");
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-gradient-to-br from-brand-300 via-brand-200 to-brand-100 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-5 py-4">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-900 text-base font-bold text-white shadow-lift ring-2 ring-white/50">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold leading-tight text-brand-700">
            {storeName}
          </p>
        </div>
        <button
          type="button"
          aria-label="Logout / Ganti Peran"
          title="Logout / Ganti Peran"
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/40 text-brand-700 transition-colors duration-150 ease-out hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
        >
          <LogOutIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
