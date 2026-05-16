const ASSET_TAGS = [
    { tag: "C0000101", label: "In service — clean" },
    { tag: "C0000104", label: "Stored" },
    { tag: "C0000107", label: "Received — no finance record" },
    { tag: "C0000108", label: "RMA pending — still racked (drift)" },
    { tag: "C0000109", label: "Disposed — not written off (action needed)" },
    { tag: "C0000110", label: "In service — rack unit mismatch (drift)" },
    { tag: "C0000199", label: "Ghost — facilities only (action needed)" },
    { tag: "C0009001", label: "Demo tag — happy path testing" },
  ];
  
  const STORAGE_LOCS = [
    { value: "Lab-Building-A/Storage-1/SHELF-9", label: "Lab-A · Storage-1 · SHELF-9" },
    { value: "Lab-Building-A/Receiving/DOCK-1", label: "Lab-A · Receiving · DOCK-1" },
    { value: "Lab-Building-B/Storage-2/SHELF-1", label: "Lab-B · Storage-2 · SHELF-1" },
  ];
  
  const RACK_LOCS = [
    { value: "Lab-Building-A/Bay-12/Aisle-3/A-01/U10", label: "Lab-A · Bay-12 · A-01 · U10" },
    { value: "Lab-Building-A/Bay-12/Aisle-3/A-01/U12", label: "Lab-A · Bay-12 · A-01 · U12" },
    { value: "Lab-Building-B/Computing-1/Aisle-1/C-12/U18", label: "Lab-B · Computing-1 · C-12 · U18" },
  ];
  
  const BADGES = [
    { value: "tech-jane", label: "tech-jane" },
    { value: "tech-mike", label: "tech-mike" },
    { value: "tech-carlos", label: "tech-carlos" },
    { value: "manager-paul", label: "manager-paul" },
  ];
  
  export default function DevBarcodesPage() {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128+Text&display=swap');
          .barcode { font-family: 'Libre Barcode 128 Text', cursive; font-size: 56px; line-height: 1; display: block; }
          @media print {
            nav, header, footer, .no-print { display: none !important; }
            body { background: white; }
          }
        `}</style>
  
        <div className="max-w-4xl mx-auto py-6 space-y-8">
          <div className="no-print">
            <h1 className="text-2xl font-bold text-gray-900">Printable barcodes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Code 128 via Libre Barcode 128 Text font. Print this page (disable headers/footers) to get physical barcodes.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3 inline-block">
              Requires internet connection to load the font. If barcodes show as text, wait and refresh.
            </p>
          </div>
  
          <BarcodeSection title="Asset tags" note="Scan on any /tech/… page as the first input.">
            {ASSET_TAGS.map((b) => <BarcodeCard key={b.tag} value={b.tag} label={b.label} />)}
          </BarcodeSection>
  
          <BarcodeSection title="Storage locations" note="Scan as location on /tech/store.">
            {STORAGE_LOCS.map((b) => <BarcodeCard key={b.value} value={b.value} label={b.label} />)}
          </BarcodeSection>
  
          <BarcodeSection title="Rack locations" note="Scan as rack on /tech/deploy. Includes full RU.">
            {RACK_LOCS.map((b) => <BarcodeCard key={b.value} value={b.value} label={b.label} />)}
          </BarcodeSection>
  
          <BarcodeSection title="Technician badges" note="Scan as recipient on /tech/transfer.">
            {BADGES.map((b) => <BarcodeCard key={b.value} value={b.value} label={b.label} />)}
          </BarcodeSection>
        </div>
      </>
    );
  }
  
  function BarcodeSection({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <p className="text-xs text-gray-500">{note}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{children}</div>
      </section>
    );
  }
  
  function BarcodeCard({ value, label }: { value: string; label: string }) {
    return (
      <div className="border rounded-lg p-3 bg-white space-y-1 overflow-hidden">
        <p className="text-[10px] text-gray-500 leading-tight">{label}</p>
        <span className="barcode">{value}</span>
        <p className="text-[9px] font-mono text-gray-400 break-all leading-tight">{value}</p>
      </div>
    );
  }