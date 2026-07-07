"use client";

import { useEffect } from "react";

/**
 * Komponen untuk mendaftarkan Service Worker PWA.
 * Render di root layout sebagai client component.
 */
export default function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }
  }, []);

  return null;
}
