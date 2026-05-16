"use client";
import { useState } from "react";
import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { CameraScanner } from "@/components/CameraScanner";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset } from "@/lib/types";

type Phase =
  | { name: "scan_asset" }
  | { name: "looking_up" }
  | { name: "asset_ready"; asset: Asset }
  | { name: "bad_state"; asset: Asset; reason: string }
  | { name: "submitting" }
  | { name: "success"; asset: Asset }
  | { name: "error"; code: string; message: string };

type ScanRecord = { tag: string; at: Date };

const SITES = ["Lab-Building-A", "Lab-Building-B", "Lab-Building-C"];
const ROOMS: Record<string, string[]> = {
  "Lab-Building-A": ["Storage-1", "Storage-2", "Staging-RMA"],
  "Lab-Building-B": ["Storage-2", "Storage-3"],
  "Lab-Building-C": ["Storage-1"],
};
const SHELVES = Array.from({ length: 12 }, (_, i) => `SHELF-${i + 1}`);

export default function TechStorePage() {
  const [phase, setPhase] = useState<Phase>({ name: "scan_asset" });
  const [tag, setTag] = useState("");
  const [site, setSite] = useState(SITES[0]!);
  const [room, setRoom] = useState(ROOMS[SITES[0]!]![0]!);
  const [shelf, setShelf] = useState(SHELVES[0]!);
  const [showCamera, setShowCamera] = useState(false);
  const [history, setHistory] = useState<ScanRecord[]>([]);

  function reset() {
    setPhase({ name: "scan_asset" });
    setTag("");
    setSite(SITES[0]!);
    setRoom(ROOMS[SITES[0]!]![0]!);
    setShelf(SHELVES[0]!);
  }

  function handleSiteChange(s: string) {
    setSite(s);
    setRoom(ROOMS[s]![0]!);
  }

  async function handleTagSubmit() {
    if (!tag.trim()) return;
    setPhase({ name: "looking_up" });
    try {
      const res = await fetch(`/api/upstream/assets/${encodeURIComponent(tag.trim())}`);
      const data = await res.json() as Asset | { error: { code: string; message: string } };

      if (!res.ok) {
        const err = (data as { error: { code: string; message: string } }).error;
        setPhase({ name: "error", code: err.code, message: err.message });
        return;
      }

      const asset = data as Asset;

      const badStateReason =
        asset.state === "stored"
          ? "This asset is already in storage. Check the location — it may just need to be moved to a different shelf."
          : asset.state === "disposed"
          ? "This asset has been disposed and can't be stored. Contact finance."
          : asset.state === "rma_pending"
          ? "This asset has an RMA pending. Resolve the RMA before storing it."
          : asset.state === "unreceived"
          ? "This asset hasn't been received yet. Complete the receive step first."
          : null;

      if (badStateReason) {
        setPhase({ name: "bad_state", asset, reason: badStateReason });
        return;
      }

      setPhase({ name: "asset_ready", asset });
    } catch {
      setPhase({ name: "error", code: "network", message: "Can't reach the server." });
    }
  }

  async function handleSubmit() {
    if (phase.name !== "asset_ready") return;
    const asset = phase.asset;
    setPhase({ name: "submitting" });
    try {
      const res = await fetch("/api/scans/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: asset.asset_tag,
          location: { site, room, row: null, rack: shelf, ru: null },
          user_id: getCurrentUserId(),
          scan_payload: `STORE|${asset.asset_tag}`,
        }),
      });
      const data = await res.json() as Asset | { error: { code: string; message: string } };
      if (!res.ok) {
        const err = (data as { error: { code: string; message: string } }).error;
        setPhase({ name: "error", code: err.code, message: err.message });
        return;
      }
      setHistory((prev) => [{ tag: asset.asset_tag, at: new Date() }, ...prev].slice(0, 5));
      setPhase({ name: "success", asset: data as Asset });
    } catch {
      setPhase({ name: "error", code: "network", message: "Store failed. Check your connection and try again." });
    }
  }

  function fmtTime(d: Date): string {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  function ScanHistory() {
    if (history.length === 0) return null;
    return (
      <div className="space-y-1.5 pt-1">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">This session</p>
        {history.map((r, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-gray-900 border border-gray-800 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="font-mono text-xs text-white">{r.tag}</span>
              <span className="text-gray-600 text-xs">stored</span>
            </div>
            <span className="text-[11px] text-gray-500">{fmtTime(r.at)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-4 space-y-5">
      {showCamera && (
        <CameraScanner
          onScan={(value) => { setTag(value); setShowCamera(false); }}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="flex items-center gap-3">
        <Link href="/tech" className="text-gray-400 hover:text-gray-600 text-sm">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Store Asset</h1>
          <p className="text-xs text-gray-400">Move equipment to a shelf or staging area.</p>
        </div>
      </div>

      {phase.name === "scan_asset" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Asset Tag</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. C0009001"
                autoFocus
                className="flex-1 rounded-lg border-2 border-gray-300 bg-white text-gray-900 p-3 text-sm font-mono focus:border-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="rounded-lg border-2 border-gray-300 px-4 text-xl hover:bg-gray-50 min-h-[44px]"
                aria-label="Scan with camera"
              >
                📷
              </button>
            </div>
          </div>
          <button
            disabled={!tag.trim()}
            onClick={handleTagSubmit}
            className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            Look up asset
          </button>
          <ScanHistory />
        </div>
      )}

      {phase.name === "looking_up" && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm animate-pulse">
          Looking up asset…
        </div>
      )}

      {phase.name === "submitting" && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm animate-pulse">
          Saving…
        </div>
      )}

      {phase.name === "bad_state" && (
        <div className="space-y-4">
          <AssetCard asset={phase.asset} />
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">Can't store this asset</p>
            <p className="text-xs text-red-700 mt-1">{phase.reason}</p>
          </div>
          <button onClick={reset} className="w-full rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">
            Try a different asset
          </button>
        </div>
      )}

      {phase.name === "asset_ready" && (
        <div className="space-y-4">
          <AssetCard asset={phase.asset} />
          {phase.asset.state === "in_service" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              <strong>De-racking</strong> — this asset is currently in service. Storing it will remove it from the rack.
            </div>
          )}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Where are you putting it?</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Site</label>
              <select value={site} onChange={(e) => handleSiteChange(e.target.value)} className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none">
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Room</label>
              <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none">
                {(ROOMS[site] ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Shelf</label>
              <select value={shelf} onChange={(e) => setShelf(e.target.value)} className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none">
                {SHELVES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 rounded-lg bg-amber-600 py-3.5 text-sm font-semibold text-white hover:bg-amber-700 min-h-[44px]">Store asset</button>
          </div>
        </div>
      )}

      {phase.name === "success" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="text-4xl mb-2">✓</div>
            <p className="font-semibold text-emerald-900 text-lg">Asset stored</p>
            <p className="text-sm text-emerald-700 mt-1 font-mono">{phase.asset.asset_tag}</p>
          </div>
          <AssetCard asset={phase.asset} />
          <button onClick={reset} className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 min-h-[44px]">Store another</button>
          <ScanHistory />
        </div>
      )}

      {phase.name === "error" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">
              {phase.code === "invalid_transition" ? "Can't store from this state"
              : phase.code === "unknown_asset" ? "Asset not found"
              : phase.code === "network" ? "Connection error"
              : "Something went wrong"}
            </p>
            <p className="text-sm text-red-700 mt-1">{phase.message}</p>
          </div>
          <button onClick={reset} className="w-full rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">Try again</button>
        </div>
      )}
    </div>
  );
}