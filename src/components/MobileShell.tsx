"use client";

import React from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

type MobileShellProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  storeName?: string;
  initial?: string;
};

export function MobileShell({
  children,
  header,
  storeName = "Myko Pingpong",
  initial = "W"
}: MobileShellProps) {
  return (
    <div className="flex min-h-full w-full justify-center bg-gradient-to-b from-[#E7EEF0] to-[#D7E4E8]">
      <div className="flex min-h-screen w-full max-w-md flex-col bg-gradient-to-b from-brand-50 via-canvas to-[#E4EEF0] shadow-card">
        {header ?? (
          <AppHeader storeName={storeName} initial={initial} />
        )}
        <main className="flex-1 px-5 pb-24 pt-6">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
