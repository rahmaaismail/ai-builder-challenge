"use client";
import { useState } from "react";
import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset } from "@/lib/types";

type Phase =
  | { name: "scan_asset" }
  | { name: "looking_up" }
  | { name: "asset_ready"; asset: Asset }
  | { name: "bad_state"; asset: Asset }
  | { name: "submitting" }
  | { name: "success"; asset: Asset }
  | { name: "error"; code: string; message: string };

const SITES = ["Lab-Building-A", "Lab-Building-B", "Lab-Building-C"];
const ROOMS: Record<string, string[]> = {
  "Lab-Building-A": ["Bay-1", "Bay-2", "Bay-3", "Bay-4", "Bay-5", "Bay-6", "Bay-7", "Bay-8", "Bay-9", "Bay-10", "Bay-11", "Bay-12", "Telecom-1"],
  "Lab-Building-B": ["Computing-1", "Computing-2", "Bay-1", "Bay-2"],
  "Lab-Building-C": ["Bay-1", "Bay-2", "Telecom-1"],
};
const ROWS = ["Aisle-1", "Aisle-2", "Aisle-3", "Aisle-4", "Aisle-5"];
const RACKS = Array.from({ length: 30 }, (_, i) => `R-${String(i + 1).padStart(2, "0")}`);
const RUS = Array.from({ length: 42 }, (_, i) => `U${String(i + 1).padStart(2, "0")}`);

export default function TechDeployPage() {
  const [phase, setPhase] = useState<Phase>({ name: "scan_asset" });
  const [tag, setTag] = useState("");
  const [site, setSite] = useState(SITES[0]!);
  const [room, setRoom] = useState(ROOMS[SITES[0]!]![0]!);
  const [row, setRow] = useState(ROWS[0]!);
  const [rack, setRack] = useState(RACKS[0]!);
  const [ru, setRu] = useState("");
  const [locationError, setLocationError] = useState("");

  function reset() {
    setPhase({ name: "scan_asset" });
    setTag("");
    setSite(SITES[0]!);
    setRoom(ROOMS[SITES[0]!]![0]!);
    setRow(ROWS[0]!);
    setRack(RACKS[0]!);
    setRu("");
    setLocationError("");
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
      const canDeploy = asset.state === "received" || asset.state === "stored";
      setPhase(canDeploy ? { name: "asset_ready", asset } : { name: "bad_state", asset });
    } catch {
      setPhase({ name: "error", code: "network", message: "Can't reach the server." });
    }
  }

  async function handleSubmit() {
    if (phase.name !== "asset_ready") return;

    // Client-side validation — catch missing ru before hitting the API
    if (!ru.trim()) {
      setLocationError("Rack unit (RU) is required to deploy. Select which U position in the rack.");
      return;
    }
    setLocationError("");

    setPhase({ name: "submitting" });
    try {
      const res = await fetch("/api/scans/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_tag: phase.asset.asset_tag,
          location: { site, room, row, rack, ru: ru.trim() },
          user_id: getCurrentUserId(),
          scan_payload: `DEPLOY|${phase.asset.asset_tag}`,
        }),
      });
      const data = await res.json() as Asset | { error: { code: string; message: string } };
      if (!res.ok) {
        const err = (data as { error: { code: string; message: string } }).error;
        setPhase({ name: "error", code: err.code, message: err.message });
        return;
      }
      setPhase({ name: "success", asset: data as Asset });
    } catch {
      setPhase({ name: "error", code: "network", message: "Deploy failed." });
    }
  }

  return (
    <div className="max-w-lg mx-auto py-4 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/tech" className="text-gray-400 hover:text-gray-600 text-sm">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deploy asset</h1>
          <p className="text-xs text-gray-500">Rack equipment and put it into service.</p>
        </div>
      </div>

      {phase.name === "scan_asset" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset tag</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. C0009001"
              autoFocus
              className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm font-mono focus:border-blue-600 focus:outline-none"
            />
          </div>
          <button
            disabled={!tag.trim()}
            onClick={handleTagSubmit}
            className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            Look up asset
          </button>
        </div>
      )}

      {phase.name === "looking_up" && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm animate-pulse">
          Looking up asset…
        </div>
      )}

      {phase.name === "submitting" && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm animate-pulse">
          Deploying…
        </div>
      )}

      {phase.name === "bad_state" && (
        <div className="space-y-4">
          <AssetCard asset={phase.asset} />
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">Can't deploy this asset</p>
            <p className="text-xs text-red-700 mt-1">
              This asset is <strong>{phase.asset.state}</strong>. Deploy is only allowed from <em>received</em> or <em>stored</em>.
              {phase.asset.state === "in_service" ? " It's already in service." : ""}
            </p>
          </div>
          <button onClick={reset} className="w-full rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">Try a different asset</button>
        </div>
      )}

      {phase.name === "asset_ready" && (
        <div className="space-y-4">
          <AssetCard asset={phase.asset} />

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Where are you racking it?</p>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Row</label>
                <select value={row} onChange={(e) => setRow(e.target.value)} className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none">
                  {ROWS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rack</label>
                <select value={rack} onChange={(e) => setRack(e.target.value)} className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none">
                  {RACKS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Rack unit (RU) <span className="text-red-500">*</span>
              </label>
              <select
                value={ru}
                onChange={(e) => { setRu(e.target.value); setLocationError(""); }}
                className={`w-full rounded-lg border-2 p-3 text-sm focus:outline-none ${locationError ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-blue-600"}`}
              >
                <option value="">Select RU position…</option>
                {RUS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {locationError && (
                <p className="text-xs text-red-600 mt-1">{locationError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 rounded-lg bg-emerald-600 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 min-h-[44px]">Deploy asset</button>
          </div>
        </div>
      )}

      {phase.name === "success" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="text-4xl mb-2">✓</div>
            <p className="font-semibold text-emerald-900 text-lg">Asset deployed</p>
            <p className="text-sm text-emerald-700 mt-1 font-mono">{phase.asset.asset_tag}</p>
          </div>
          <AssetCard asset={phase.asset} />
          <button onClick={reset} className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 min-h-[44px]">Deploy another</button>
        </div>
      )}

      {phase.name === "error" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-900">
              {phase.code === "incomplete_deploy_location" ? "Missing rack position"
              : phase.code === "invalid_transition" ? "Can't deploy from this state"
              : phase.code === "unknown_asset" ? "Asset not found"
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