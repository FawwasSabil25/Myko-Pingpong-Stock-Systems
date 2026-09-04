"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, XIcon } from 'lucide-react';

type DetailHeaderProps = {
  title: string;
  backTo?: string;
  action?: 'back' | 'close';
};

export function DetailHeader({ title, backTo, action = 'back' }: DetailHeaderProps) {
  const router = useRouter();
  const isClose = action === 'close';
  const Icon = isClose ? XIcon : ArrowLeftIcon;

  const goBack = () => (backTo ? router.push(backTo) : router.back());

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-gradient-to-br from-brand-300 via-brand-200 to-brand-100 backdrop-blur-sm">
      <div
        className={[
          'flex items-center gap-2 px-4 py-4',
          isClose ? 'flex-row-reverse' : '',
        ].join(' ')}
      >
        <button
          type="button"
          aria-label={isClose ? 'Tutup' : 'Kembali'}
          onClick={goBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/40 text-brand-700 transition-colors duration-150 ease-out hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 cursor-pointer"
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold text-brand-700">{title}</h1>
      </div>
    </header>
  );
}
