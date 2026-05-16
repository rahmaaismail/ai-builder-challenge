import type { Asset } from "@/lib/types";
import { StateBadge } from "./StateBadge";

function fmtLoc(a: Asset): string {
  const l = a.location;
  return [l.site, l.room, l.rack, l.ru].filter(Boolean).join(" › ");
}

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono font-bold text-gray-900 text-base">{asset.asset_tag}</p>
          <p className="text-sm text-gray-700 truncate">{asset.model}</p>
          <p className="text-xs text-gray-400 font-mono">{asset.serial}</p>
        </div>
        <StateBadge state={asset.state} />
      </div>
      <div className="border-t pt-2 space-y-1">
        <Row label="Location" value={fmtLoc(asset)} />
        <Row label="Custodian" value={asset.custodian} />
        {asset.procurement_note && <Row label="Note" value={asset.procurement_note} />}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 shrink-0 w-20">{label}</span>
      <span className="text-gray-700 break-words min-w-0">{value}</span>
    </div>
  );
}