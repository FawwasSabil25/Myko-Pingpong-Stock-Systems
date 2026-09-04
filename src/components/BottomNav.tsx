"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, ArchiveIcon, ShoppingBagIcon, BarChart3Icon, BoxIcon } from "lucide-react";
import { getRole, type Role } from "@/lib/role";

type NavItem = {
  label: string;
  to: string;
  icon: typeof BoxIcon;
};

const pemilikItems: NavItem[] = [
  {
    label: "Beranda",
    to: "/beranda",
    icon: HomeIcon,
  },
  {
    label: "Produk",
    to: "/produk",
    icon: ArchiveIcon,
  },
  {
    label: "Pesanan",
    to: "/pemilik/pesanan",
    icon: ShoppingBagIcon,
  },
  {
    label: "Rekap",
    to: "/pemilik/rekap",
    icon: BarChart3Icon,
  },
];

const pengelolaItems: NavItem[] = [
  {
    label: "Beranda",
    to: "/beranda",
    icon: HomeIcon,
  },
  {
    label: "Pesanan",
    to: "/pesanan",
    icon: ShoppingBagIcon,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [role, setRoleState] = useState<Role | null>(null);

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  if (!role) return null;

  const items = role === "pemilik" ? pemilikItems : pengelolaItems;

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/60 bg-gradient-to-b from-brand-100 to-brand-200 px-3 pb-3 pt-2 backdrop-blur-sm"
    >
      <ul className="flex items-stretch justify-between gap-1 max-w-md mx-auto">
        {items.map(({ label, to, icon: Icon }) => {
          const isActive =
            pathname === to ||
            (to !== "/beranda" && pathname.startsWith(to)) ||
            (to === "/pesanan" && pathname.startsWith("/pengelola/pesanan"));

          return (
            <li key={label} className="flex-1">
              <Link
                href={to}
                className={[
                  "flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700",
                  isActive
                    ? "bg-gradient-to-b from-white to-brand-50 text-brand-600 shadow-card"
                    : "text-brand-500/70 hover:bg-white/50",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 1.8} />
                <span className={isActive ? "text-xs font-bold" : "text-xs font-medium"}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
