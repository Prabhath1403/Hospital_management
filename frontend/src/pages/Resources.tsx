const faqs = [
  { q: "Do you offer 24/7 emergency care?", a: "Yes, with on-call specialists and ICU." },
  { q: "Which insurance plans do you accept?", a: "Major providers; please share your card at reception." },
  { q: "Can I pay online?", a: "Yes, UPI, cards, and net banking are supported." }
];

const tips = [
  "Stay hydrated and maintain a balanced diet.",
  "Regular screenings for blood pressure, sugar, and cholesterol.",
  "Exercise 30 minutes daily; consult your doctor before starting."
];

export default function Resources() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Patient Resources</h1>
        <p className="text-slate-600">FAQs, health tips, preventive care, and blog highlights.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-semibold mb-2">FAQs</div>
          <ul className="space-y-2 text-sm text-slate-700">
            {faqs.map((f) => (
              <li key={f.q}>
                <div className="font-medium">{f.q}</div>
                <div className="text-slate-600">{f.a}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="font-semibold mb-2">Health tips</div>
          <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

