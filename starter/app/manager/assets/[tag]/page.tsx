import Link from "next/link";
import { notFound } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import { StateBadge } from "@/components/StateBadge";
import type { Asset, Event } from "@/lib/types";

function fmtTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtLoc(loc: Asset["location"]): string {
  return [loc.site, loc.room, loc.row, loc.rack, loc.ru].filter(Boolean).join(" › ") || "—";
}

function initials(name: string): string {
  return name.split("-").map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
}

const EVENT_LABELS: Record<string, string> = {
  receive:           "Received",
  store:             "Stored",
  deploy:            "Deployed",
  rma_open:          "RMA opened",
  rma_receive_back:  "Returned from RMA",
  dispose:           "Disposed",
  duplicate_receive: "Duplicate receive scan",
  transfer_custody:  "Custody transferred",
};

function eventDot(type: string): string {
  switch (type) {
    case "receive":          return "bg-blue-400";
    case "deploy":           return "bg-emerald-400";
    case "store":            return "bg-amber-400";
    case "dispose":          return "bg-gray-400";
    case "rma_open":         return "bg-orange-400";
    case "transfer_custody": return "bg-purple-400";
    default:                 return "bg-gray-400";
  }
}

function eventBadge(type: string): string {
  switch (type) {
    case "receive":          return "bg-blue-50 text-blue-700 border-blue-200";
    case "deploy":           return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "store":            return "bg-amber-50 text-amber-700 border-amber-200";
    case "dispose":          return "bg-gray-100 text-gray-600 border-gray-200";
    case "rma_open":         return "bg-orange-50 text-orange-700 border-orange-200";
    case "transfer_custody": return "bg-purple-50 text-purple-700 border-purple-200";
    default:                 return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export default async function ManagerAssetDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const api = createApiClient();

  let asset: Asset;
  let events: Event[];
  try {
    [asset, events] = await Promise.all([
      api.assets.get(tag),
      api.assets.history(tag),
    ]);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6 p-1">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/manager" className="hover:text-gray-300 transition-colors">
          Assets Dashboard
        </Link>
        <span className="text-gray-700">›</span>
        <span className="font-mono text-gray-100">{asset.asset_tag}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-white font-mono tracking-tight">
            {asset.asset_tag}
          </h1>
          <p className="text-sm text-white-500 mt-1">{asset.model ?? asset.asset_class ?? ""}</p>
        </div>
        <StateBadge state={asset.state} />
      </div>

      {/* Body */}
      <div className="grid md:grid-cols-2 gap-5 items-start">
        {/* Left — detail cards */}
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-1.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
              Current location
            </p>
            {[
              ["Site", asset.location.site],
              ["Room", asset.location.room],
              asset.location.row  ? ["Row",  asset.location.row]  : null,
              asset.location.rack ? ["Rack", asset.location.rack] : null,
              asset.location.ru   ? ["RU",   String(asset.location.ru)] : null,
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="font-mono text-[11px] text-gray-900 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                  {value ?? "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
              Custodian
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[11px] font-medium text-purple-700 flex-shrink-0">
                {initials(asset.custodian)}
              </div>
              <span className="font-mono text-sm text-gray-900 font-medium">{asset.custodian}</span>
            </div>
          </div>

          {asset.procurement_note && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">
                Procurement note
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{asset.procurement_note}</p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
              Record
            </p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Created</span>
              <span className="text-xs text-gray-700">{fmtTs(asset.created_at)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Updated</span>
              <span className="text-xs text-gray-700">{fmtTs(asset.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Right — event history */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-medium text-white">Event History</h2>
            <span className="bg-gray-800 border border-gray-700 text-gray-400 text-[11px] font-medium px-2 py-0.5 rounded-full">
              {events.length} events
            </span>
          </div>

          {events.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-500 text-sm">
              No events recorded.
            </div>
          ) : (
            <div>
              {events.map((ev, i) => (
                <div key={ev.id} className="flex gap-2.5">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full mt-2 ${eventDot(ev.event_type)}`} />
                    {i < events.length - 1 && (
                      <div className="flex-1 w-px bg-gray-800 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2.5">
                    <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${eventBadge(ev.event_type)}`}>
                          {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                        </span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{fmtTs(ev.timestamp)}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 space-y-0.5 leading-relaxed">
                        <p>
                          By{" "}
                          <span className="font-mono text-gray-700 font-medium">{ev.user_id}</span>
                        </p>
                        {ev.to_location && (
                          <p className="text-gray-400">
                            → <span className="text-gray-600">{fmtLoc(ev.to_location)}</span>
                          </p>
                        )}
                        {ev.from_state !== ev.to_state && (
                          <p>
                            <span className="font-mono text-gray-400 text-[10px]">{ev.from_state ?? "—"}</span>
                            <span className="text-gray-300 mx-1">→</span>
                            <span className="font-mono text-gray-700 text-[10px] font-medium">{ev.to_state}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}