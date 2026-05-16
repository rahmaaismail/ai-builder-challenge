import Link from "next/link";

const WORKFLOWS = [
  { href: "/tech/receive", icon: "📦", title: "Receive", desc: "Log incoming equipment off the truck.", color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50" },
  { href: "/tech/store", icon: "🗄️", title: "Store", desc: "Move equipment to a shelf or staging area.", color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50" },
  { href: "/tech/deploy", icon: "🚀", title: "Deploy", desc: "Rack equipment and put it into service.", color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50" },
  { href: "/tech/transfer", icon: "🔄", title: "Transfer", desc: "Hand off custody to another technician.", color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50" },
];

export default function TechLandingPage() {
  return (
    <div className="max-w-lg mx-auto py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">What are you doing?</h1>
        <p className="text-sm text-gray-500 mt-1">Pick a workflow below.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {WORKFLOWS.map((w) => (
          <Link key={w.href} href={w.href} className={`rounded-xl border-2 p-4 transition-colors ${w.color}`}>
            <div className="text-2xl mb-2">{w.icon}</div>
            <p className="font-semibold text-gray-900">{w.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{w.desc}</p>
          </Link>
        ))}
      </div>
      <div className="text-center">
        <Link href="/manager" className="text-sm text-gray-400 hover:text-gray-600">Switch to manager view →</Link>
      </div>
    </div>
  );
}