import Link from "next/link";

const WORKFLOWS = [
  { href: "/tech/receive",  icon: "📦", title: "Receive",  desc: "Log incoming equipment off the truck." },
  { href: "/tech/store",    icon: "🗄️", title: "Store",    desc: "Move to a shelf or staging area." },
  { href: "/tech/deploy",   icon: "🚀", title: "Deploy",   desc: "Rack equipment and put it into service." },
  { href: "/tech/transfer", icon: "🔄", title: "Transfer", desc: "Hand off custody to another technician." },
];

export default function TechLandingPage() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#030712", overflowY: "auto" }}>
      <div className="min-h-full text-white">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Lab Tech</h1>
            <p className="text-gray-400 mt-1 text-sm">Select a workflow to begin scanning.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {WORKFLOWS.map((w) => (
              <Link
                key={w.href}
                href={w.href}
                className="rounded-2xl border border-gray-800 bg-gray-900 hover:bg-gray-800 p-6 flex flex-col gap-2 transition-colors active:scale-95"
              >
                <span className="text-3xl">{w.icon}</span>
                <span className="text-lg font-semibold text-white">{w.title}</span>
                <span className="text-xs text-gray-400 leading-snug">{w.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}