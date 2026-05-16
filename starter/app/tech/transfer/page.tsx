"use client";
import { useState } from "react";
import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { StateBadge } from "@/components/StateBadge";
import { CameraScanner } from "@/components/CameraScanner";
import { api, ApiError } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset } from "@/lib/types";

type Phase =
  | { name: "scan_asset" }
  | { name: "looking_up" }
  | { name: "asset_ready"; asset: Asset }
  | { name: "bad_state"; asset: Asset; reason: string }
  | { name: "confirm"; asset: Asset; toCustodian: string }
  | { name: "submitting" }
  | { name: "success"; asset: Asset; fromCustodian: string }
  | { name: "error"; code: string; message: string };

export default function TechTransferPage() {
  const [phase, setPhase] = useState<Phase>({ name: "scan_asset" });
  const [tag, setTag] = useState("");
  const [badge, setBadge] = useState("");
  const [badgeError, setBadgeError] = useState("");
  const [showAssetCamera, setShowAssetCamera] = useState(false);
  const [showBadgeCamera, setShowBadgeCamera] = useState(false);

  function reset() {
    setPhase({ name: "scan_asset" });
    setTag("");
    setBadge("");
    setBadgeError("");
  }

  async function handleAssetSubmit() {
    if (!tag.trim()) return;
    setPhase({ name: "looking_up" });
    try {
      const asset = await api.assets.get(tag.trim());

      const badStateReason =
        asset.state === "disposed"
          ? "This asset has been disposed and can't be transferred. Contact finance."
          : asset.state === "unreceived"
          ? "This asset hasn't been received yet and can't be transferred."
          : asset.state === "rma_pending"
          ? "This asset has an RMA pending. Resolve it before transferring."
          : null;

      if (badStateReason) {
        setPhase({ name: "bad_state", asset, reason: badStateReason });
      } else {
        setPhase({ name: "asset_ready", asset });
      }
    } catch (err) {
      if (err instanceof ApiError) setPhase({ name: "error", code: err.code, message: err.message });
      else setPhase({ name: "error", code: "network", message: "Can't reach the server." });
    }
  }

  function handleBadgeSubmit() {
    if (phase.name !== "asset_ready" || !badge.trim()) return;
    const myId = getCurrentUserId();

    if (badge.trim() === myId) {
      setBadgeError("That's your own badge. Enter the recipient's badge instead.");
      return;
    }
    if (badge.trim() === phase.asset.custodian) {
      setBadgeError(`${badge.trim()} is already the custodian. No transfer needed.`);
      return;
    }

    setBadgeError("");
    setPhase({ name: "confirm", asset: phase.asset, toCustodian: badge.trim() });
  }

  async function handleSubmit() {
    if (phase.name !== "confirm") return;
    const fromCustodian = phase.asset.custodian;
    setPhase({ name: "submitting" });
    try {
      const result = await api.scans.transfer({
        asset_tag: phase.asset.asset_tag,
        to_custodian: phase.toCustodian,
        user_id: getCurrentUserId(),
        scan_payload: `TRANSFER|${phase.asset.asset_tag}|${phase.toCustodian}`,
      });
      setPhase({ name: "success", asset: result, fromCustodian });
    } catch (err) {
      if (err instanceof ApiError) setPhase({ name: "error", code: err.code, message: err.message });
      else setPhase({ name: "error", code: "network", message: "Transfer failed. Check your connection and try again." });
    }
  }

  return (
    <div className="max-w-lg mx-auto py-4 space-y-5">
      {showAssetCamera && (
        <CameraScanner
          onScan={(value) => { setTag(value); setShowAssetCamera(false); }}
          onClose={() => setShowAssetCamera(false)}
        />
      )}
      {showBadgeCamera && (
        <CameraScanner
          onScan={(value) => { setBadge(value); setShowBadgeCamera(false); }}
          onClose={() => setShowBadgeCamera(false)}
        />
      )}

      <div className="flex items-center gap-3">
        <Link href="/tech" className="text-gray-400 hover:text-gray-600 text-sm">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Transfer Custody</h1>
          <p className="text-xs text-gray-400">Hand off this asset to another technician.</p>
        </div>
      </div>

      <div className="text-xs text-gray-400 text-right">
        Logged in as <span className="font-mono font-medium text-white">{getCurrentUserId()}</span>
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
                onClick={() => setShowAssetCamera(true)}
                className="rounded-lg border-2 border-gray-300 px-4 text-xl hover:bg-gray-50 min-h-[44px]"
                aria-label="Scan with camera"
              >
                📷
              </button>
            </div>
          </div>
          <button
            disabled={!tag.trim()}
            onClick={handleAssetSubmit}
            className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            Look up asset
          </button>
        </div>
      )}

      {(phase.name === "looking_up" || phase.name === "submitting") && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm animate-pulse">
          {phase.name === "looking_up" ? "Looking up asset…" : "Transferring…"}
        </div>
      )}

      {phase.name === "bad_state" && (
        <div className="space-y-4">
          <AssetCard asset={phase.asset} />
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">Can't transfer this asset</p>
            <p className="text-xs text-red-700 mt-1">{phase.reason}</p>
          </div>
          <button onClick={reset} className="w-full rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">
            Scan a different asset
          </button>
        </div>
      )}

      {phase.name === "asset_ready" && (
        <div className="space-y-4">
          <AssetCard asset={phase.asset} />
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-700">
            Current custodian: <strong>{phase.asset.custodian}</strong>. Enter the recipient's badge below.
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">Recipient's Badge</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={badge}
                onChange={(e) => { setBadge(e.target.value); setBadgeError(""); }}
                placeholder="e.g. tech-mike"
                className={`flex-1 rounded-lg border-2 bg-white text-gray-900 p-3 text-sm font-mono focus:outline-none ${badgeError ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-blue-600"}`}
              />
              <button
                type="button"
                onClick={() => setShowBadgeCamera(true)}
                className="rounded-lg border-2 border-gray-300 px-4 text-xl hover:bg-gray-50 min-h-[44px]"
                aria-label="Scan badge with camera"
              >
                📷
              </button>
            </div>
            {badgeError
              ? <p className="text-xs text-red-600 mt-1 px-1">{badgeError}</p>
              : <p className="text-xs text-gray-400 mt-1 px-1">Badge value is the recipient's user ID — e.g. tech-mike</p>
            }
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">Cancel</button>
            <button
              disabled={!badge.trim()}
              onClick={handleBadgeSubmit}
              className="flex-1 rounded-lg bg-purple-600 py-3.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {phase.name === "confirm" && (
        <div className="space-y-4">
          <AssetCard asset={phase.asset} />
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <p className="text-xs text-gray-400">Transfer details</p>
            <div className="flex items-center gap-3">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-400">From</p>
                <p className="font-mono font-semibold text-gray-900 text-sm">{phase.asset.custodian}</p>
              </div>
              <div className="text-gray-300 text-xl">→</div>
              <div className="text-center flex-1">
                <p className="text-xs text-gray-400">To</p>
                <p className="font-mono font-semibold text-gray-900 text-sm">{phase.toCustodian}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">State stays <StateBadge state={phase.asset.state} /> — only custodian changes.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 rounded-lg bg-purple-600 py-3.5 text-sm font-semibold text-white hover:bg-purple-700 min-h-[44px]">Transfer custody</button>
          </div>
        </div>
      )}

      {phase.name === "success" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="text-4xl mb-2">✓</div>
            <p className="font-semibold text-emerald-900 text-lg">Custody transferred</p>
            <p className="text-sm text-emerald-700 mt-1">{phase.fromCustodian} → {phase.asset.custodian}</p>
          </div>
          <AssetCard asset={phase.asset} />
          <button onClick={reset} className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 min-h-[44px]">Scan next asset</button>
        </div>
      )}

      {phase.name === "error" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">
              {phase.code === "same_custodian" ? "Already the custodian"
              : phase.code === "unknown_asset" ? "Asset not found"
              : phase.code === "network" ? "Connection error"
              : "Transfer failed"}
            </p>
            <p className="text-sm text-red-700 mt-1">{phase.message}</p>
          </div>
          <button onClick={reset} className="w-full rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">Start over</button>
        </div>
      )}
    </div>
  );
}