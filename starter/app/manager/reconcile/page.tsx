"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ReconciliationReport, ReportItem } from "@/lib/reconcile";

type Status = { state: "loading" } | { state: "ok"; report: ReconciliationReport } | { state: "error"; message: string };

export default function ManagerReconcilePage() {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    fetch("/api/reconcile")
      .then((r) => r.json())
      .then((data: ReconciliationReport) => setStatus({ state: "ok", report: data }))
      .catch((e) => setStatus({ state: "error", message: String(e) }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/manager" className="text-sm text-gray-400 hover:text-gray-300">← Assets</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Three-Way Reconciliation</h1>
          <p className="text-sm text-gray-400 mt-0.5">Comparing ops, facilities, and finance.</p>
        </div>
        {status.state === "ok" && (
          <p className="text-xs text-gray-400 whitespace-nowrap">
            Generated {new Date(status.report.generated_at).toLocaleString()}
          </p>
        )}
      </div>

      {status.state === "loading" && (
        <div className="space-y-3 animate-pulse">
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 h-16" />)}
          </div>
          {[...Array(3)].map((_, i) => <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 h-24" />)}
          <p className="text-sm text-gray-500 text-center">Pulling from three systems…</p>
        </div>
      )}

      {status.state === "error" && (
        <div className="rounded-xl border border-red-800 bg-red-950 px-5 py-4">
          <p className="font-semibold text-red-400 text-sm">Failed to load report</p>
          <p className="text-sm text-red-500 mt-1">{status.message}</p>
          <p className="text-xs text-red-600 mt-2">Make sure the API is running and API_TOKEN is set in starter/.env</p>
        </div>
      )}

      {status.state === "ok" && <Report report={status.report} />}
    </div>
  );
}

function Report({ report }: { report: ReconciliationReport }) {
  const { summary, action, investigate, expected } = report;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Ops assets"     value={summary.ops_total}        color="text-white"        />
        <SummaryCard label="Action needed"  value={summary.action_count}     color="text-red-400"     bg="bg-red-950 border-red-800" />
        <SummaryCard label="Investigate"    value={summary.investigate_count} color="text-amber-400"  bg="bg-amber-950 border-amber-800" />
        <SummaryCard label="Clean"          value={summary.clean_count}      color="text-emerald-400" bg="bg-emerald-950 border-emerald-800" />
      </div>

      <Section title="Action Required"  subtitle="These need someone to fix them before the next audit." color="red"   items={action}     emptyText="No action items — everything is in order." />
      <Section title="Investigate"      subtitle="Worth verifying before close of month."                color="amber" items={investigate} emptyText="Nothing to investigate." />
      {expected.length > 0 && (
        <Section title="Expected gaps" subtitle="These differences are explained by how the three systems work. No action needed." color="gray" items={expected} emptyText="" collapsed />
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">System coverage</p>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-xl font-bold text-white">{summary.ops_total.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-0.5">Operations</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{summary.facilities_total.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-0.5">Facilities</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{summary.finance_total.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-0.5">Finance</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, color, items, emptyText, collapsed = false }: {
  title: string; subtitle: string; color: "red" | "amber" | "gray";
  items: ReportItem[]; emptyText: string; collapsed?: boolean;
}) {
  const [open, setOpen] = useState(!collapsed || items.length > 0);
  const hc = { red: "text-red-400", amber: "text-amber-400", gray: "text-gray-400" };
  const cc = { red: "bg-red-950 text-red-400 border border-red-800", amber: "bg-amber-950 text-amber-400 border border-amber-800", gray: "bg-gray-800 text-gray-400" };
  return (
    <div className="space-y-3">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 w-full text-left">
        <h2 className={`text-base font-semibold ${hc[color]}`}>{title}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cc[color]}`}>{items.length}</span>
        <span className="text-gray-600 text-xs ml-auto">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <>
          <p className="text-sm text-white">{subtitle}</p>
          {items.length === 0
            ? <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 text-sm text-gray-500">{emptyText}</div>
            : <div className="space-y-2">{items.map((item, i) => <IssueCard key={`${item.asset_tag}-${i}`} item={item} color={color} />)}</div>
          }
        </>
      )}
    </div>
  );
}

function IssueCard({ item, color }: { item: ReportItem; color: "red" | "amber" | "gray" }) {
  const lb = { red: "border-l-red-500", amber: "border-l-amber-500", gray: "border-l-gray-600" };
  return (
    <div className={`rounded-xl border border-gray-800 bg-white border-l-4 ${lb[color]} p-4 space-y-2`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-mono text-white-400">{item.category}</span>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">{item.title}</p>
        </div>
        {item.asset_tag && (
          <Link href={`/manager/assets/${item.asset_tag}`} className="font-mono text-blue-600 hover:underline text-xs shrink-0">
            {item.asset_tag}
          </Link>
        )}
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{item.detail}</p>
      {(item.ops_state ?? item.fac_location ?? item.fin_status) && (
        <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-100 text-xs text-gray-500">
          {item.ops_state    && <span><span className="text-gray-400">Ops: </span>{item.ops_state}</span>}
          {item.ops_location && <span><span className="text-gray-400">Location: </span><span className="font-mono">{item.ops_location}</span></span>}
          {item.fac_location && <span><span className="text-gray-400">Facilities: </span><span className="font-mono">{item.fac_location}</span></span>}
          {item.fin_status   && <span><span className="text-gray-400">Finance: </span>{item.fin_status}{item.fin_book_value != null ? ` ($${item.fin_book_value.toLocaleString()})` : ""}</span>}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, bg = "bg-gray-900 border-gray-800" }: {
  label: string; value: number; color: string; bg?: string;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${bg}`}>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-xs text-white-500 mt-0.5">{label}</p>
    </div>
  );
}
