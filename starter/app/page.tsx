import Link from "next/link";

export default function HomePage() {
  return (
    <div className="-mx-4 -my-6 min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto px-6 pt-20 pb-12 w-full">
        <div className="mb-2 inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium tracking-wide uppercase">Live</span>
        </div>

        <h1 className="text-5xl font-semibold tracking-tight text-white mt-4 leading-tight">
          Lab Asset<br />Tracking
        </h1>
        <p className="text-gray-400 mt-4 text-lg max-w-md leading-relaxed">
          Multi-site instrument management across operations, facilities, and finance — built for the dock bay and the manager dashboard.
        </p>

        {/* Two entry points — the only two that matter */}
        <div className="mt-10 grid grid-cols-2 gap-4 max-w-sm">
          <Link
            href="/tech"
            className="rounded-2xl bg-white text-gray-950 font-semibold px-6 py-4 text-center hover:bg-gray-100 active:scale-95 transition-all"
          >
            <span className="block text-2xl mb-1">📱</span>
            Tech
            <span className="block text-xs font-normal text-gray-500 mt-0.5">Scan workflows</span>
          </Link>
          <Link
            href="/manager"
            className="rounded-2xl bg-gray-800 text-white font-semibold px-6 py-4 text-center hover:bg-gray-700 active:scale-95 transition-all border border-gray-700"
          >
            <span className="block text-2xl mb-1">📊</span>
            Manager
            <span className="block text-xs font-normal text-gray-400 mt-0.5">Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Feature strip */}
      <div className="border-t border-gray-800">
        <div className="max-w-2xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: "Three-way reconciliation", desc: "Ops · Facilities · Finance" },
            { icon: "⚡", title: "Scan-first UX",            desc: "Built for gloves and dock bays" },
            { icon: "📍", title: "Full audit trail",         desc: "Every move, every custodian" },
          ].map((f) => (
            <div key={f.title}>
              <span className="text-2xl">{f.icon}</span>
              <p className="text-sm font-medium text-white mt-2">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dev tools — small and out of the way */}
      <div className="border-t border-gray-800/50">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-700">Dev</span>
          <Link href="/dev/barcodes" className="text-xs text-gray-600 hover:text-gray-400 underline underline-offset-2">
            Test barcodes →
          </Link>
        </div>
      </div>

    </div>
  );
}