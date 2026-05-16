"use client";
import { useState } from "react";
import Link from "next/link";
import { ScanInput } from "@/components/ScanInput";
import { StateBadge } from "@/components/StateBadge";
import { api, ApiError } from "@/lib/api-client";
import { getCurrentUserId } from "@/lib/auth";
import type { Asset } from "@/lib/types";

type Phase =
  | { name: "scan" }
  | { name: "submitting" }
  | { name: "success"; asset: Asset; isNew: boolean }
  | { name: "error"; code: string; message: string; details?: Record<string, unknown> };

const SITES = ["Lab-Building-A", "Lab-Building-B", "Lab-Building-C"];
const DOCKS = ["DOCK-1", "DOCK-2", "DOCK-3", "DOCK-4"];

export default function TechReceivePage() {
  const [phase, setPhase] = useState<Phase>({ name: "scan" });
  const [tag, setTag] = useState("");
  const [serial, setSerial] = useState("");
  const [site, setSite] = useState(SITES[0]!);
  const [dock, setDock] = useState(DOCKS[0]!);

  function reset() {
    setPhase({ name: "scan" });
    setTag(""); setSerial("");
    setSite(SITES[0]!); setDock(DOCKS[0]!);
  }

  async function handleSubmit() {
    if (!tag.trim() || !serial.trim()) return;

    if (!/^C\d{7}$/.test(tag.trim())) {
      setPhase({
        name: "error",
        code: "invalid_tag_format",
        message: `"${tag}" isn't a valid asset tag. Tags start with C followed by 7 digits, e.g. C0009001.`,
      });
      return;
    }

    setPhase({ name: "submitting" });

    try {
      // Try to get existing asset first to check serial
      let existingSerial: string | null = null;
      try {
        const existing = await api.assets.get(tag.trim());
        existingSerial = existing.serial;
      } catch {
        // 404 = new asset, that's fine
      }

      // If exists with different serial, show error immediately
      if (existingSerial && existingSerial !== serial.trim()) {
        setPhase({
          name: "error",
          code: "and_match_failed",
          message: "This tag is registered to a different item.",
          details: {
            expected_serial: existingSerial,
            provided_serial: serial.trim(),
          },
        });
        return;
      }

      const asset = await api.scans.receive({
        asset_tag: tag.trim(),
        serial: serial.trim(),
        model: "Unknown",
        manufacturer: "Unknown",
        asset_class: "instrument",
        location: { site, room: "Receiving", row: null, rack: dock, ru: null },
        user_id: getCurrentUserId(),
        scan_payload: `RECEIVE|${tag.trim()}|${serial.trim()}`,
      });

      setPhase({ name: "success", asset, isNew: existingSerial === null });
    } catch (err) {
      if (err instanceof ApiError) {
        setPhase({
          name: "error",
          code: err.code,
          message: err.message,
          details: err.details,
        });
      } else {
        setPhase({ name: "error", code: "network", message: "Can't reach the server. Try again." });
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto py-4 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/tech" className="text-gray-400 hover:text-gray-600 text-sm">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receive asset</h1>
          <p className="text-xs text-gray-500">Scan or type the tag and serial from the box.</p>
        </div>
      </div>

      {phase.name === "scan" && (
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial number</label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="e.g. SN-DEMO-1"
              className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
              <select value={site} onChange={(e) => setSite(e.target.value)} className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none">
                {SITES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dock</label>
              <select value={dock} onChange={(e) => setDock(e.target.value)} className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm focus:border-blue-600 focus:outline-none">
                {DOCKS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <button
            disabled={!tag.trim() || !serial.trim()}
            onClick={handleSubmit}
            className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            Receive asset
          </button>
        </div>
      )}

      {phase.name === "submitting" && (
        <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm animate-pulse">
          Checking asset…
        </div>
      )}

      {phase.name === "success" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="text-4xl mb-2">✓</div>
            <p className="font-semibold text-emerald-900 text-lg">
              {phase.isNew ? "Asset received" : "Asset received"}
            </p>
            <p className="text-sm text-emerald-700 mt-1 font-mono">{phase.asset.asset_tag}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Serial</span>
              <span className="font-mono">{phase.asset.serial}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">State</span>
              <StateBadge state={phase.asset.state} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Location</span>
              <span>{[phase.asset.location.site, phase.asset.location.room, phase.asset.location.rack].filter(Boolean).join(" › ")}</span>
            </div>
          </div>
          <button onClick={reset} className="w-full rounded-lg bg-gray-900 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 min-h-[44px]">
            Scan next asset
          </button>
        </div>
      )}

      {phase.name === "error" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-900">
              {phase.code === "invalid_tag_format" ? "Invalid tag format"
              : phase.code === "and_match_failed" ? "Serial doesn't match"
              : phase.code === "unknown_asset" ? "Asset not found"
              : "Something went wrong"}
            </p>

            {phase.code === "and_match_failed" && phase.details ? (
              <div className="space-y-2">
                <p className="text-sm text-red-700">
                  Please check the serial number on the box and try again.
                </p>
                <div className="rounded-lg bg-white border border-red-200 p-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Serial on file</span>
                    <span className="font-mono font-bold text-gray-900">
                      {String((phase.details as Record<string, unknown>).expected_serial ?? "—")}
                    </span>
                  </div>
                  <div className="h-px bg-red-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Serial you entered</span>
                    <span className="font-mono font-bold text-red-700">
                      {String((phase.details as Record<string, unknown>).provided_serial ?? "—")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-700">{phase.message}</p>
            )}
          </div>

          <button onClick={reset} className="w-full rounded-lg border border-gray-300 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 min-h-[44px]">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}