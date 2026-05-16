import Link from "next/link";
import { notFound } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import { StateBadge } from "@/components/StateBadge";
import type { Asset, Event } from "@/lib/types";

function fmtTs(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtLoc(loc: Asset["location"]): string {
  return [loc.site, loc.room, loc.row, loc.rack, loc.ru].filter(Boolean).join(" › ") || "—";
}

const EVENT_LABELS: Record<string, string> = {
  receive: "Received", store: "Stored", deploy: "Deployed", rma_open: "RMA opened",
  rma_receive_back: "Returned from RMA", dispose: "Disposed",
  duplicate_receive: "Duplicate receive scan", transfer_custody: "Custody transferred",
};

function eventDot(type: string): string {
  switch (type) {
    case "receive": return "bg-blue-500";
    case "deploy": return "bg-emerald-500";
    case "store": return "bg-amber-500";
    case "dispose": return "bg-gray-400";
    case "rma_open": return "bg-orange-500";
    case "transfer_custody": return "bg-purple-500";
    default: return "bg-gray-300";
  }
}

export default async function ManagerAssetDetailPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const api = createApiClient();

  let asset: Asset;
  let events: Event[];
  try {
    [asset, events] = await Promise.all([api.assets.get(tag), api.assets.history(tag)]);
  } catch { notFound(); }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/manager" className="hover:text-gray-700">Assets</Link>
        <span className="mx-1.5">›</span>
        <span className="font-mono font-medium text-gray-900">{asset.asset_tag}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-gray-900">{asset.asset_tag}</h1>
            <StateBadge state={asset.state} />
          </div>
          <p className="text-gray-600 mt-1">{asset.model}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{asset.manufacturer} · {asset.serial}</p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{asset.asset_class}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Card title="Current location">
            <Row label="Site" value={asset.location.site ?? "—"} />
            <Row label="Room" value={asset.location.room ?? "—"} />
            {asset.location.row && <Row label="Row" value={asset.location.row} />}
            {asset.location.rack && <Row label="Rack" value={asset.location.rack} />}
            {asset.location.ru && <Row label="RU" value={asset.location.ru} />}
          </Card>
          <Card title="Custodian">
            <p className="font-mono text-sm text-gray-800">{asset.custodian}</p>
          </Card>
          {asset.procurement_note && (
            <Card title="Procurement note">
              <p className="text-sm text-gray-700 leading-relaxed">{asset.procurement_note}</p>
            </Card>
          )}
          <Card title="Record">
            <Row label="Created" value={fmtTs(asset.created_at)} />
            <Row label="Updated" value={fmtTs(asset.updated_at)} />
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Event history <span className="text-gray-400 font-normal">({events.length})</span></h2>
          {events.length === 0 ? (
            <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm">No events recorded.</div>
          ) : (
            <div className="space-y-0">
              {events.map((ev, i) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${eventDot(ev.event_type)}`} />
                    {i < events.length - 1 && <div className="flex-1 w-px bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="rounded-lg border bg-white px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900">{EVENT_LABELS[ev.event_type] ?? ev.event_type}</span>
                        <span className="text-xs text-gray-400 shrink-0">{fmtTs(ev.timestamp)}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>By <span className="font-mono">{ev.user_id}</span></p>
                        {ev.to_location && <p>→ {fmtLoc(ev.to_location)}</p>}
                        {ev.from_state !== ev.to_state && <p className="text-gray-400">{ev.from_state ?? "—"} → {ev.to_state}</p>}
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 text-right">{value}</span>
    </div>
  );
}
