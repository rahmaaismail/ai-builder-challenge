import Link from "next/link";
import { createApiClient } from "@/lib/api-client";
import { StateBadge } from "@/components/StateBadge";
import { AssetFilterBar } from "./AssetFilterBar";
import type { Asset, AssetState } from "@/lib/types";

const STATE_ORDER: AssetState[] = ["in_service","stored","received","rma_pending","disposed","unreceived"];

const STATE_COLORS: Record<AssetState, string> = {
  in_service:  "text-emerald-700",
  stored:      "text-amber-700",
  received:    "text-blue-700",
  rma_pending: "text-orange-700",
  disposed:    "text-gray-500",
  unreceived:  "text-slate-500",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtLoc(a: Asset): string {
  return [a.location.site, a.location.room].filter(Boolean).join(" / ") || "—";
}

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { state, site, custodian, page: pageStr } = params;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const PER_PAGE = 25;

  const api = createApiClient();
  const assets = (await api.assets.list({ state, site, custodian })).reverse();

  const stateCounts = STATE_ORDER.reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s]: assets.filter((a) => a.state === s).length }),
    {},
  );

  const totalPages = Math.max(1, Math.ceil(assets.length / PER_PAGE));
  const safePage   = Math.min(page, totalPages);
  const paged      = assets.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const activeFilter = state ?? site ?? custodian;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets Dashboard</h1>
          <p className="text-sm text-white mt-0.5">
            {assets.length.toLocaleString()} asset{assets.length !== 1 ? "s" : ""}
            {activeFilter ? " (filtered)" : ""}
          </p>
        </div>
        <Link href="/manager/reconcile" className="text-sm font-medium text-white-700 hover:underline whitespace-nowrap">
          Three-Way Reconciliation →
        </Link>
      </div>

      {/* State pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATE_ORDER.map((s) => (
          <Link
            key={s}
            href={`/manager?state=${s}`}
            className={`rounded-lg border bg-white px-3 py-2 text-center hover:bg-gray-50 transition-colors ${state === s ? "ring-2 ring-white-500" : ""}`}
          >
            <p className={`text-lg font-bold ${STATE_COLORS[s]}`}>{(stateCounts[s] ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 capitalize">{s.replace("_", " ")}</p>
          </Link>
        ))}
      </div>

      <AssetFilterBar current={{ state, site, custodian }} />

      {paged.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-400">
            {activeFilter ? "No assets match this filter." : "No assets in the system yet."}
          </p>
          {activeFilter && (
            <Link href="/manager" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Tag</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">State</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Location</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Custodian</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.map((asset) => (
                  <tr key={asset.asset_tag} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/manager/assets/${asset.asset_tag}`} className="font-mono text-blue-700 hover:underline font-medium">
                        {asset.asset_tag}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">{asset.model}</td>
                    <td className="px-4 py-3"><StateBadge state={asset.state} /></td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{fmtLoc(asset)}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs hidden md:table-cell">{asset.custodian}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{fmtDate(asset.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Page {safePage} of {totalPages}</span>
              <div className="flex gap-2">
                {safePage > 1 && (
                  <Link
                    href={`/manager?${new URLSearchParams({ ...(state ? { state } : {}), ...(site ? { site } : {}), ...(custodian ? { custodian } : {}), page: String(safePage - 1) })}`}
                    className="rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {safePage < totalPages && (
                  <Link
                    href={`/manager?${new URLSearchParams({ ...(state ? { state } : {}), ...(site ? { site } : {}), ...(custodian ? { custodian } : {}), page: String(safePage + 1) })}`}
                    className="rounded-lg border px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}