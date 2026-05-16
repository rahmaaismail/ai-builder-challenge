"use client";

import { usePathname } from "next/navigation";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isHome = path === "/";

  return (
    <>
      {!isHome && (
        <header className="border-b bg-white sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold text-gray-900 hover:text-gray-600 transition-colors">
              Asset tracking
            </a>
            <RoleSwitcher />
          </div>
        </header>
      )}
      <main className={isHome ? "" : "max-w-5xl mx-auto px-4 py-6"}>
        {children}
      </main>
    </>
  );
}