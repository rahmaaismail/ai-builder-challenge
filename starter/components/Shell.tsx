"use client";
import React from "react";
import { usePathname } from "next/navigation";

const FULL_BLEED = ["/", "/tech"];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isHome = path === "/";
  const isFullBleed = FULL_BLEED.includes(path) || path.startsWith("/tech/");

  if (isHome) return <>{children}</>;

  const isDark = isFullBleed || path.startsWith("/manager");

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "#030712" : "white", color: isDark ? "white" : "inherit" }}>
      <header className={`sticky top-0 z-30 border-b ${isDark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-200"}`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className={`font-semibold transition-colors ${isDark ? "text-white hover:text-gray-300" : "text-gray-900 hover:text-gray-600"}`}>
            Asset Tracking
          </a>
        </div>
      </header>
      <main className={isFullBleed ? "" : "max-w-5xl mx-auto px-4 py-6"}>
        {children}
      </main>
    </div>
  );
}
