import type { AssetState } from "@/lib/types";

const CONFIG: Record<AssetState, { label: string; cls: string }> = {
  unreceived:  { label: "Unreceived",  cls: "bg-slate-100 text-slate-700 ring-slate-300" },
  received:    { label: "Received",    cls: "bg-blue-100 text-blue-800 ring-blue-300" },
  stored:      { label: "Stored",      cls: "bg-amber-100 text-amber-800 ring-amber-300" },
  in_service:  { label: "In service",  cls: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  rma_pending: { label: "RMA pending", cls: "bg-orange-100 text-orange-800 ring-orange-300" },
  disposed:    { label: "Disposed",    cls: "bg-gray-100 text-gray-500 ring-gray-300" },
};

export function StateBadge({ state }: { state: AssetState }) {
  const c = CONFIG[state] ?? CONFIG.unreceived;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${c.cls}`}>
      {c.label}
    </span>
  );
}