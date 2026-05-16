import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#030712", overflowY: "auto" }}
    >
      <div className="min-h-full text-white flex flex-col">

        {/* Nav */}
        <div className="max-w-2xl mx-auto px-6 pt-8 w-full flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-400 tracking-tight">
            asset<span className="text-white">track</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium tracking-wide uppercase">Live</span>
          </div>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto px-6 pt-16 pb-12 w-full">
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1]">
            Lab Asset<br />
            <span className="text-gray-500">Tracking.</span>
          </h1>
          <p className="text-gray-400 mt-5 text-lg max-w-sm leading-relaxed">
            Multi-site instrument management across operations, facilities, and finance.
          </p>

          {/* Both white */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 max-w-sm">
            <Link
              href="/tech"
              className="flex-1 rounded-2xl bg-white text-gray-950 font-semibold px-6 py-5 text-center hover:bg-gray-100 active:scale-95 transition-all"
            >
              <span className="block text-3xl mb-2">📱</span>
              <span className="block text-base">Tech</span>
              <span className="block text-xs font-normal text-gray-500 mt-0.5">Scan workflows</span>
            </Link>
            <Link
              href="/manager"
              className="flex-1 rounded-2xl bg-white text-gray-950 font-semibold px-6 py-5 text-center hover:bg-gray-100 active:scale-95 transition-all"
            >
              <span className="block text-3xl mb-2">📊</span>
              <span className="block text-base">Manager</span>
              <span className="block text-xs font-normal text-gray-500 mt-0.5">Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Feature strip */}
        <div className="border-t border-gray-800">
          <div className="max-w-2xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: "🔍", title: "Three-way reconciliation", desc: "Ops · Facilities · Finance — one report, every gap explained." },
              { icon: "⚡", title: "Scan-first UX",            desc: "Designed for gloves, dock bays, and 11pm shifts." },
              { icon: "📍", title: "Full audit trail",         desc: "Every move, every custodian, every state change." },
            ].map((f) => (
              <div key={f.title}>
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-semibold text-white mt-3">{f.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dev footer */}
        <div className="border-t border-gray-800/40">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-xs text-gray-700">Dev tools</span>
            <Link href="/dev/barcodes" className="text-xs text-gray-600 hover:text-gray-400 underline underline-offset-2 transition-colors">
              Test barcodes →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}