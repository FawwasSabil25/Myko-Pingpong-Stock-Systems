"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

export default function PesananRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getRole();
    if (role === "pemilik") {
      router.replace("/pemilik/pesanan");
    } else if (role === "pengelola") {
      router.replace("/beranda");
    } else {
      router.replace("/setup");
    }
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-screen bg-white">
      <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
