"use client";

import React, { useState, useEffect, useRef } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  
  const startY = useRef(0);
  const isAtTop = useRef(true);
  const threshold = 70; // min distance to trigger refresh

  useEffect(() => {
    // Mencegah overscroll native PWA/Browser (pull-to-reload bawaan Chrome)
    document.body.style.overscrollBehaviorY = "contain";
    return () => {
      document.body.style.overscrollBehaviorY = "auto";
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        isAtTop.current = true;
        startY.current = e.touches[0].clientY;
      } else {
        isAtTop.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isAtTop.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      if (diff > 0 && window.scrollY <= 0) {
        setIsPulling(true);
        // Tambahkan resistance agar tarikan terasa berat
        setPullY(Math.min(diff * 0.4, threshold + 20));
        
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isRefreshing) return;
      
      setIsPulling(false);
      
      setPullY((prevPullY) => {
        if (prevPullY >= threshold) {
          setIsRefreshing(true);
          onRefresh().finally(() => {
            setIsRefreshing(false);
            setPullY(0);
          });
          return threshold;
        }
        return 0;
      });
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isRefreshing, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Indikator Loading */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-end overflow-hidden transition-all duration-200"
        style={{ 
          height: isRefreshing ? `${threshold}px` : `${pullY}px`,
          zIndex: 50,
        }}
      >
        <div className="mb-4">
          <div 
            className={`w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center
                          ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: !isRefreshing ? `rotate(${pullY * 3}deg)` : undefined }}
          >
            <svg 
              className="w-5 h-5 text-[#00647C]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Konten Halaman */}
      <div 
        className="transition-transform duration-200 w-full h-full min-h-screen"
        style={{ 
          transform: `translateY(${isRefreshing ? threshold : pullY}px)` 
        }}
      >
        {children}
      </div>
    </div>
  );
}
