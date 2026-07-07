"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const role = getRole();
    if (role) {
      router.replace("/beranda");
    } else {
      router.replace("/setup");
    }
    setChecking(false);
  }, [router]);

  // Show a minimal loading state while checking localStorage
  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
