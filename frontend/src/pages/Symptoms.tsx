import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import AISymptomChecker from "../components/AISymptomChecker";

type SymptomCard = { slug: string; symptom: string; specialists: string[] };

type SymptomDetail = {
  symptom: string;
  specialists: string[];
  prevention: string[];
  tests: string[];
  doctors: {
    id: string;
    name: string;
    specialization: string;
    experience: number;
    image: string;
    rating?: number;
  }[];
};

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState<SymptomCard[]>([]);
  const [selected, setSelected] = useState<SymptomDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<SymptomCard[]>("/symptoms")
      .then((res) => setSymptoms(res.data))
      .catch(() => setError("Unable to load symptoms right now."));
  }, []);

  const openDetail = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<SymptomDetail>(`/symptoms/${slug}`);
      setSelected(data);
    } catch (e) {
      setError("Could not load symptom details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Common Symptoms</h1>
      <p className="text-slate-600 mb-6">
        Tap a symptom to view specialists, prevention tips, tests, and
        recommended doctors.
      </p>

      <div className="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold text-blue-900 mb-3">
          🤖 AI Symptom Checker
        </h2>
        <p className="text-sm text-blue-800 mb-4">
          Describe your symptoms and get AI-powered health insights with
          specialist recommendations and suggested tests.
        </p>
        <AISymptomChecker />
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}
      <div className="grid md:grid-cols-3 gap-4">
        {symptoms.map((s) => (
          <button
            key={s.slug}
            className="card text-left hover:shadow-md transition"
            onClick={() => openDetail(s.slug)}
          >
            <div className="font-semibold">{s.symptom}</div>
            <div className="flex gap-2 mt-2">
              {s.specialists.map((sp) => (
                <span
                  key={sp}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {sp}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-20">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 animate-[fadeIn_0.2s_ease]">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm uppercase text-blue-700 font-semibold">
                  Symptom
                </div>
                <h2 className="text-2xl font-bold">{selected.symptom}</h2>
                <div className="flex gap-2 mt-2">
                  {selected.specialists.map((sp) => (
                    <span
                      key={sp}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-slate-600 mt-4">
                Loading details...
              </div>
            ) : (
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="card">
                  <div className="font-semibold">Prevention tips</div>
                  <ul className="list-disc ml-5 text-sm text-slate-700 mt-2">
                    {selected.prevention.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <div className="font-semibold">Recommended tests</div>
                  <ul className="list-disc ml-5 text-sm text-slate-700 mt-2">
                    {selected.tests.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="font-semibold mb-2">Recommended doctors</div>
              <div className="grid md:grid-cols-2 gap-3">
                {selected.doctors.map((d) => (
                  <div key={d.id} className="card flex gap-3 items-start">
                    <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden">
                      <img
                        src={d.image}
                        alt={d.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-sm text-slate-600">
                        {d.specialization}
                      </div>
                      <div className="text-xs text-slate-500">
                        {d.experience} yrs{d.rating ? ` · ⭐ ${d.rating}` : ""}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          className="btn-primary text-xs"
                          onClick={() => navigate("/doctors")}
                        >
                          View Profile
                        </button>
                        <button
                          className="btn-primary text-xs"
                          onClick={() => {
                            setSelected(null);
                            window.location.href = "/#book";
                          }}
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              This is guidance, not a diagnosis. Please consult a qualified
              doctor.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
