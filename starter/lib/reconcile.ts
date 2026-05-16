import { createApiClient } from "@/lib/api-client";
import type { Asset, FacilitiesRecord, FinanceRecord } from "@/lib/types";

export type Severity = "action" | "investigate" | "expected";

export type ReportItem = {
  asset_tag: string;
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  ops_state?: string;
  ops_location?: string;
  ops_model?: string;
  ops_serial?: string;
  ops_custodian?: string;
  fac_location?: string;
  fin_status?: string;
  fin_book_value?: number;
};

export type ReconciliationReport = {
  generated_at: string;
  summary: {
    ops_total: number;
    facilities_total: number;
    finance_total: number;
    action_count: number;
    investigate_count: number;
    expected_count: number;
    clean_count: number;
  };
  action: ReportItem[];
  investigate: ReportItem[];
  expected: ReportItem[];
};

function fmtOpsLoc(asset: Asset): string {
  const l = asset.location;
  return [l.site, l.room, l.row, l.rack, l.ru].filter(Boolean).join("/");
}

function parseFacLoc(loc: string) {
  const [site = "", room = null, row = null, rack = null, ru = null] =
    loc.split("/") as [string?, string?, string?, string?, string?];
  return { site, room, row, rack, ru };
}

function locationsMatch(asset: Asset, facLoc: string): boolean {
  const f = parseFacLoc(facLoc);
  const l = asset.location;
  return l.site === f.site && l.room === f.room && l.rack === f.rack && l.ru === f.ru;
}

function usd(n?: number): string {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

export async function runReconciliation(): Promise<ReconciliationReport> {
  const api = createApiClient();

  const [ops, facilities, finance] = await Promise.all([
    api.assets.list(),
    api.mock.facilities(),
    api.mock.finance(),
  ]);

  const opsMap = new Map<string, Asset>(ops.map((a) => [a.asset_tag, a]));
  const facMap = new Map<string, FacilitiesRecord>(facilities.map((f) => [f.tagged_id, f]));
  const finMap = new Map<string, FinanceRecord>(finance.map((f) => [f.tag, f]));

  const action: ReportItem[] = [];
  const investigate: ReportItem[] = [];
  const expected: ReportItem[] = [];

  for (const asset of ops) {
    const fac = facMap.get(asset.asset_tag);
    const fin = finMap.get(asset.asset_tag);
    const opsLoc = fmtOpsLoc(asset);

    const base = {
      asset_tag: asset.asset_tag,
      ops_state: asset.state,
      ops_location: opsLoc,
      ops_model: asset.model,
      ops_serial: asset.serial,
      ops_custodian: asset.custodian,
      fac_location: fac?.rack_location,
      fin_status: fin?.status,
      fin_book_value: fin?.book_value_usd,
    };

    if (asset.state === "in_service") {
      if (!fac) {
        investigate.push({
          ...base,
          severity: "investigate",
          category: "missing_from_facilities",
          title: "Deployed asset missing from facilities",
          detail: `Ops has ${asset.asset_tag} in service at ${opsLoc}, but facilities has no record. This can happen if the deploy write-back failed. Re-scan to sync.`,
        });
      } else if (!locationsMatch(asset, fac.rack_location)) {
        action.push({
          ...base,
          severity: "action",
          category: "location_drift",
          title: "Rack position mismatch",
          detail: `Ops says ${asset.asset_tag} is at ${opsLoc}. Facilities records it at ${fac.rack_location}. Someone moved this asset without scanning. Physically verify, then scan to correct.`,
        });
      }
    }

    if (asset.state === "disposed") {
      if (fac) {
        action.push({
          ...base,
          severity: "action",
          category: "disposed_still_racked",
          title: "Disposed asset still listed as racked",
          detail: `${asset.asset_tag} was marked disposed in ops, but facilities still shows it at ${fac.rack_location}. Facilities needs to remove this position record.`,
        });
      }
      if (fin && fin.status !== "retired") {
        action.push({
          ...base,
          severity: "action",
          category: "write_off_pending",
          title: "Disposed asset not written off",
          detail: `${asset.asset_tag} is disposed in ops but finance still carries it as "${fin.status}" with book value ${usd(fin.book_value_usd)}. Finance needs to retire this before the next audit.`,
        });
      }
    }

    if (asset.state === "rma_pending" && fac) {
      action.push({
        ...base,
        severity: "action",
        category: "rma_still_racked",
        title: "RMA asset still showing as racked",
        detail: `${asset.asset_tag} is pending RMA return but facilities still records it at ${fac.rack_location}. It should have been de-racked when the RMA was opened.`,
      });
    }

    if (
      asset.state !== "in_service" &&
      asset.state !== "disposed" &&
      asset.state !== "rma_pending" &&
      fac
    ) {
      investigate.push({
        ...base,
        severity: "investigate",
        category: "non_service_in_facilities",
        title: "Non-deployed asset in facilities",
        detail: `${asset.asset_tag} is "${asset.state}" in ops but facilities still shows it at ${fac.rack_location}. A de-rack scan may have been missed.`,
      });
    }

    if (!fin) {
      if (asset.state === "in_service" || asset.state === "stored") {
        investigate.push({
          ...base,
          severity: "investigate",
          category: "missing_from_finance",
          title: "Active asset with no finance record",
          detail: `${asset.asset_tag} is ${asset.state} in ops but has no finance record. The PO may not have been processed yet.`,
        });
      } else if (asset.state === "received") {
        expected.push({
          ...base,
          severity: "expected",
          category: "pre_capitalization",
          title: "Received — awaiting finance",
          detail: `${asset.asset_tag} has been received in ops but finance hasn't processed it yet. Normal for recently-arrived assets.`,
        });
      }
    }
  }

  for (const fac of facilities) {
    if (!opsMap.has(fac.tagged_id)) {
      action.push({
        asset_tag: fac.tagged_id,
        severity: "action",
        category: "ghost_record",
        title: "Untracked equipment in facilities",
        detail: `Facilities records equipment at ${fac.rack_location} under tag ${fac.tagged_id} (last seen ${new Date(fac.last_observed).toLocaleDateString()}), but ops has no asset with this tag. Scan it into the system immediately.`,
        fac_location: fac.rack_location,
      });
    }
  }

  for (const fin of finance) {
    if (!opsMap.has(fin.tag)) {
      if (fin.status === "pending_receipt") {
        expected.push({
          asset_tag: fin.tag,
          severity: "expected",
          category: "finance_pre_receipt",
          title: "PO issued — not yet received",
          detail: `Finance has a PO for ${fin.tag} (${usd(fin.book_value_usd)}) but ops hasn't received it yet. Expected for assets in transit.`,
          fin_status: fin.status,
          fin_book_value: fin.book_value_usd,
        });
      } else if (fin.status === "capitalized" || fin.status === "impaired") {
        investigate.push({
          asset_tag: fin.tag,
          severity: "investigate",
          category: "finance_no_ops",
          title: "Finance asset with no ops record",
          detail: `Finance carries ${fin.tag} as "${fin.status}" (${usd(fin.book_value_usd)}) but ops has no record. Could be a tag discrepancy in the ERP. Verify and correct.`,
          fin_status: fin.status,
          fin_book_value: fin.book_value_usd,
        });
      }
    }
  }

  const flagged = new Set([
    ...action.map((i) => i.asset_tag),
    ...investigate.map((i) => i.asset_tag),
    ...expected.map((i) => i.asset_tag),
  ]);
  const cleanCount = ops.filter((a) => !flagged.has(a.asset_tag)).length;

  return {
    generated_at: new Date().toISOString(),
    summary: {
      ops_total: ops.length,
      facilities_total: facilities.length,
      finance_total: finance.length,
      action_count: action.length,
      investigate_count: investigate.length,
      expected_count: expected.length,
      clean_count: cleanCount,
    },
    action,
    investigate,
    expected,
  };
}