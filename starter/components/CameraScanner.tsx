"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

type Props = {
  onScan: (value: string) => void;
  onClose: () => void;
};

type ScanState = "scanning" | "success" | "unstable" | "invalid";

export function CameraScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [attemptKey, setAttemptKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const noScanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannedValue = useRef<string | null>(null);
  const unstableCount = useRef(0);
  const scanStateRef = useRef<ScanState>("scanning");
  const didScanRef = useRef(false);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function clearNoScanTimer() {
    if (noScanTimer.current) {
      clearTimeout(noScanTimer.current);
      noScanTimer.current = null;
    }
  }

  function startNoScanTimer() {
    if (noScanTimer.current) return;
    noScanTimer.current = setTimeout(() => {
      noScanTimer.current = null;
      if (scanStateRef.current !== "scanning") return;
      unstableCount.current += 1;
      if (unstableCount.current >= 2) {
        scanStateRef.current = "invalid";
        setScanState("invalid");
      } else {
        scanStateRef.current = "unstable";
        setScanState("unstable");
      }
    }, 3000);
  }

  function handleClose() {
    clearNoScanTimer();
    stopCamera();
    onClose();
  }

  function handleTryAgain(fullReset = false) {
    if (fullReset) unstableCount.current = 0;
    clearNoScanTimer();
    scanStateRef.current = "scanning";
    setScanState("scanning");
    setAttemptKey((k) => k + 1);
  }

  useEffect(() => {
    didScanRef.current = false;
    let cancelled = false;

    async function start() {
      try {
        // We call getUserMedia ourselves so we own the stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Decode from the video element directly (no getUserMedia call inside zxing)
        reader.decodeFromVideoElement(video, (result, err) => {
          if (didScanRef.current) return;

          if (result) {
            const value = result.getText();
            if (!value || value.trim().length === 0) return;

            didScanRef.current = true;
            scannedValue.current = value;
            scanStateRef.current = "success";
            setScanState("success");
            unstableCount.current = 0;
            clearNoScanTimer();
            stopCamera();

            setTimeout(() => {
              onScan(value.trim());
            }, 800);
          } else if (err) {
            if (scanStateRef.current === "scanning") {
              startNoScanTimer();
            }
          }
        });

        startNoScanTimer();
      } catch (e: any) {
        if (cancelled) return;
        if (e?.message?.includes("Permission") || e?.name === "NotAllowedError") {
          setError("Camera permission denied. Allow camera access and try again.");
        } else {
          setError("Couldn't start camera. Try typing the tag instead.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      clearNoScanTimer();
      stopCamera();
    };
  }, [attemptKey]);

  // ── Success ──────────────────────────────────────────────────────────────────
  if (scanState === "success") {
    return (
      <div className="fixed inset-0 z-50 bg-emerald-500 flex flex-col items-center justify-center space-y-4">
        <div className="text-white text-7xl">✓</div>
        <p className="text-white text-xl font-semibold">Scanned!</p>
        <p className="text-emerald-100 text-sm font-mono">{scannedValue.current}</p>
      </div>
    );
  }

  // ── Hold still ────────────────────────────────────────────────────────────────
  if (scanState === "unstable") {
    return (
      <div className="fixed inset-0 z-50 bg-amber-500 flex flex-col items-center justify-center space-y-4 px-8 text-center">
        <div className="text-white text-6xl">⚠</div>
        <p className="text-white text-xl font-semibold">Hold still</p>
        <p className="text-amber-100 text-sm">
          No QR code detected. Try centering the code in the frame and holding steady.
        </p>
        <button
          onClick={() => handleTryAgain(false)}
          className="mt-4 rounded-lg bg-white text-amber-700 font-semibold px-6 py-3 text-sm hover:bg-amber-50"
        >
          Try again
        </button>
        <button onClick={handleClose} className="text-amber-200 text-sm underline">
          Cancel
        </button>
      </div>
    );
  }

  // ── Unable to read ────────────────────────────────────────────────────────────
  if (scanState === "invalid") {
    return (
      <div className="fixed inset-0 z-50 bg-red-500 flex flex-col items-center justify-center space-y-4 px-8 text-center">
        <div className="text-white text-6xl">✕</div>
        <p className="text-white text-xl font-semibold">Unable to read</p>
        <p className="text-red-100 text-sm">
          Please try scanning a valid QR code. Make sure it's not damaged, obscured, or too far away.
        </p>
        <button
          onClick={() => handleTryAgain(true)}
          className="mt-4 rounded-lg bg-white text-red-700 font-semibold px-6 py-3 text-sm hover:bg-red-50"
        >
          Try again
        </button>
        <button onClick={handleClose} className="text-red-200 text-sm underline">
          Cancel
        </button>
      </div>
    );
  }

  // ── Scanning ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <p className="text-gray-900 text-sm font-medium">Point camera at QR code</p>
        <button
          onClick={handleClose}
          className="text-gray-600 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <div className="flex-1 relative">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gray-900 rounded-tl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gray-900 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gray-900 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gray-900 rounded-br" />
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={handleClose} className="text-red-500 text-xs underline mt-1">
            Go back
          </button>
        </div>
      )}

      <div className="px-4 py-3 bg-white border-t">
        <p className="text-gray-400 text-xs text-center">Hold steady — scanning automatically</p>
      </div>
    </div>
  );
}