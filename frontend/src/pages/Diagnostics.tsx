const tests = [
  { name: "Blood Panel", price: "$30" },
  { name: "ECG", price: "$20" },
  { name: "X-Ray", price: "$40" },
  { name: "CT Scan", price: "$180" },
  { name: "MRI", price: "$240" },
  { name: "Ultrasound", price: "$80" }
];

export default function Diagnostics() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Tests & Diagnostics</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {tests.map((t) => (
          <div key={t.name} className="card">
            <div className="font-semibold">{t.name}</div>
            <div className="text-sm text-slate-500">Pricing: {t.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

