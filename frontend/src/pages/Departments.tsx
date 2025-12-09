const departments = [
  { title: "Cardiology", desc: "Cath Lab, ECG, Echo, cardiac ICU, heart failure clinic." },
  { title: "Emergency & ICU", desc: "24/7 trauma, stroke code, rapid triage, ambulance." },
  { title: "Diagnostics", desc: "Blood tests, imaging (X-Ray, CT, MRI, Ultrasound), ECG." },
  { title: "General Medicine", desc: "Primary care, chronic disease, preventive care." }
];

export default function Departments() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Departments</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {departments.map((d) => (
          <div key={d.title} className="card">
            <div className="font-semibold">{d.title}</div>
            <p className="text-sm text-slate-600 mt-1">{d.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

