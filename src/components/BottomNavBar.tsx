"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getRole, type Role } from "@/lib/role";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function ProdukIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function PesananIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 18v-1" />
      <path d="M14 18v-3" />
      <path d="M10 13V9" />
      <path d="M14 13v-1" />
    </svg>
  );
}

function RekapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

const pemilikNav: NavItem[] = [
  { label: "Beranda", href: "/beranda", icon: <HomeIcon /> },
  { label: "Produk", href: "/produk", icon: <ProdukIcon /> },
  { label: "Pesanan", href: "/pemilik/pesanan", icon: <PesananIcon /> },
  { label: "Rekap", href: "/rekap", icon: <RekapIcon /> },
];

const pengelolaNav: NavItem[] = [
  { label: "Beranda", href: "/beranda", icon: <HomeIcon /> },
  { label: "Pesanan", href: "/pesanan", icon: <PesananIcon /> },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const [role, setRoleState] = useState<Role | null>(null);

  useEffect(() => {
    setRoleState(getRole());
  }, []);

  if (!role) return null;

  const navItems = role === "pemilik" ? pemilikNav : pengelolaNav;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#F1F5F9] flex items-center justify-around px-[30px] py-[9px]"
      style={{ boxShadow: "0px -4px 12px rgba(0, 0, 0, 0.05)", height: "66px" }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-[10px] transition-colors duration-200 min-w-[56px] ${
              isActive
                ? "bg-[rgba(236,254,255,0.5)]"
                : "hover:bg-gray-50"
            }`}
          >
            <span className={isActive ? "text-[#0891B2]" : "text-[#94A3B8]"}>
              {item.icon}
            </span>
            <span
              className={`text-[11px] font-medium leading-[17px] ${
                isActive ? "text-[#0891B2]" : "text-[#94A3B8]"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
