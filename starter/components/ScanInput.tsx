"use client";

import { useEffect, useRef } from "react";

export interface ScanInputProps {
  onScan: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  label?: string;
}

export function ScanInput({
  onScan,
  placeholder = "Scan or type a tag and press Enter…",
  autoFocus = true,
  disabled = false,
  label,
}: ScanInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current && !disabled) {
      ref.current.focus();
    }
  }, [autoFocus, disabled]);

  function fire(): void {
    const el = ref.current;
    if (!el) return;
    const v = el.value.trim();
    if (!v) return;
    onScan(v);
    el.value = "";
    el.focus();
  }

  return (
    <label className="block">
      {label ? (
        <span className="block text-sm font-medium text-white mb-2">
          {label}
        </span>
      ) : null}
      <input
        ref={ref}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full text-lg p-4 min-h-[44px] rounded-lg border-2 border-gray-300 bg-white text-gray-900 focus:border-blue-600 focus:outline-none disabled:bg-gray-100"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            fire();
          }
        }}
      />
    </label>
  );
}
