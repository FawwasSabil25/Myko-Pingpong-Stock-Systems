import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Myko Pingpong — Manajemen Stok",
  description:
    "Sistem Informasi Manajemen Stok Terpusat untuk UMKM Myko Pingpong",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Myko Pingpong",
  },
};

export const viewport: Viewport = {
  themeColor: "#00647C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
