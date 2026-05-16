"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CameraScanner } from "@/components/CameraScanner";

const ASSET_TAGS = [
  { tag: "C0000101", label: "In service — clean" },
  { tag: "C0000104", label: "Stored" },
  { tag: "C0000107", label: "Received — no finance record" },
  { tag: "C0000108", label: "RMA pending — still racked (drift)" },
  { tag: "C0000109", label: "Disposed — not written off (action needed)" },
  { tag: "C0000110", label: "In service — rack unit mismatch (drift)" },
  { tag: "C0000199", label: "Ghost — facilities only (action needed)" },
  { tag: "C0009001", label: "Demo tag — happy path testing" },
];

const BADGES = [
  { value: "tech-jane", label: "tech-jane" },
  { value: "tech-mike", label: "tech-mike" },
  { value: "tech-carlos", label: "tech-carlos" },
  { value: "manager-paul", label: "manager-paul" },
];

export default function DevBarcodesPage() {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  return (
    <>
      {scanning && (
        <CameraScanner
          onScan={(val) => {
            setLastScan(val);
            setScanning(false); // closes scanner after green screen
          }}
          onClose={() => setScanning(false)}
        />
      )}

      <div className="max-w-4xl mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR codes for testing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Scan these with the 📷 button on any tech page. Works on phone or laptop webcam.
          </p>
        </div>

        <Section title="Asset tags" note="Scan on any /tech/… page.">
          {ASSET_TAGS.map((b) => (
            <QRCard key={b.tag} value={b.tag} label={b.label} />
          ))}
        </Section>

        <Section title="Technician badges" note="Scan as recipient on /tech/transfer.">
          {BADGES.map((b) => (
            <QRCard key={b.value} value={b.value} label={b.label} />
          ))}
        </Section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Test scanner</h2>
            <p className="text-xs text-gray-500">
              Green: scan a code above. Orange: wait 3s. Red: hit try again, wait another 3s.
            </p>
          </div>
          <button
            onClick={() => { setLastScan(null); setScanning(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700"
          >
            📷 Open scanner
          </button>
          {lastScan && (
            <p className="text-sm text-gray-700">
              Last scan: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{lastScan}</span>
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500">{note}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{children}</div>
    </section>
  );
}

function QRCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="border rounded-xl p-4 bg-white space-y-2 flex flex-col items-center">
      <QRCodeSVG value={value} size={140} />
      <p className="text-xs text-gray-500 text-center leading-tight">{label}</p>
      <p className="text-[10px] font-mono text-gray-400 text-center break-all">{value}</p>
    </div>
  );
}