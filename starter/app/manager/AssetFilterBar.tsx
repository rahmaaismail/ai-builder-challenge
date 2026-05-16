"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { current: { state?: string; site?: string; custodian?: string } };

const STATES = [
  { value: "", label: "All states" },
  { value: "in_service", label: "In service" },
  { value: "stored", label: "Stored" },
  { value: "received", label: "Received" },
  { value: "rma_pending", label: "RMA pending" },
  { value: "disposed", label: "Disposed" },
];

const SITES = [
  { value: "", label: "All sites" },
  { value: "Lab-Building-A", label: "Lab-Building-A" },
  { value: "Lab-Building-B", label: "Lab-Building-B" },
  { value: "Lab-Building-C", label: "Lab-Building-C" },
];

export function AssetFilterBar({ current }: Props) {
  const router = useRouter();
  const [custodian, setCustodian] = useState(current.custodian ?? "");

  function update(key: string, value: string) {
    const sp = new URLSearchParams();
    if (key !== "state"     && current.state)     sp.set("state",     current.state);
    if (key !== "site"      && current.site)       sp.set("site",      current.site);
    if (key !== "custodian" && current.custodian)  sp.set("custodian", current.custodian);
    if (value) sp.set(key, value);
    router.push(`/manager?${sp.toString()}`);
  }

  const hasFilter = !!(current.state || current.site || current.custodian);

  const selectCls = "rounded-lg border border-white-700 bg-white-900 text-gray-500 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none appearance-none";

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select
        value={current.state ?? ""}
        onChange={(e) => update("state", e.target.value)}
        className={selectCls}
      >
        {STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <select
        value={current.site ?? ""}
        onChange={(e) => update("site", e.target.value)}
        className={selectCls}
      >
        {SITES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <input
        type="text"
        value={custodian}
        onChange={(e) => setCustodian(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") update("custodian", custodian); }}
        onBlur={() => { if (custodian !== (current.custodian ?? "")) update("custodian", custodian); }}
        placeholder="Custodian (press Enter)…"
        className="rounded-lg border border-white-700 bg-white-900 text-blue-400 placeholder:text-gray-500 px-3 py-2 text-sm focus:border-white-500 focus:outline-none min-w-[180px]"
      />

      {hasFilter && (
        <button
          onClick={() => { setCustodian(""); router.push("/manager"); }}
          className="text-sm text-gray-500 hover:text-gray-300 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}