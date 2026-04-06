import { useState } from "react";
import { api } from "../lib/api";

interface HealthSummary {
  profile: { name: string; age: string | number; gender: string; blood_group: string };
  vitals: { bp_systolic: number | null; bp_diastolic: number | null; blood_sugar: number | null; heart_rate: number | null; recorded_at: string | null }[];
  medications: { drug_name: string; dosage: string; condition_for: string; start_date: string | null }[];
  past_medications: { drug_name: string; dosage: string; condition_for: string; start_date: string | null }[];
  alerts: { alert_type: string; severity: string; message: string; created_at: string | null }[];
  past_visits: { name: string; symptoms: string; diagnosis: string | null; completed_at: string | null }[];
  diet_summary: { avg_calories: number; avg_protein: number; avg_carbs: number; avg_fat: number };
}

export default function HealthRecords() {
  const [data, setData] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const fetchSummary = async () => {
    if (data) {
      setExpanded(!expanded);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/clinical/my-health-summary");
      setData(res.data);
      setExpanded(true);
    } catch (err: any) {
      setError("Failed to load health records.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-100 text-red-700 border-red-300";
      case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default: return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={fetchSummary}
        className="w-full text-left flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
      >
        <span>🩺 My Health Records & Conditions</span>
        <span className="text-2xl">{expanded ? "▲" : "▼"}</span>
      </button>

      {loading && (
        <div className="card mt-3 text-center py-6 text-slate-500">
          <div className="animate-pulse">Loading your complete health profile...</div>
        </div>
      )}

      {error && (
        <div className="card mt-3 text-center py-4 text-red-500 font-semibold">{error}</div>
      )}

      {expanded && data && (
        <div className="mt-3 space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-indigo-500">
            <h3 className="font-bold text-lg text-indigo-700 mb-3">👤 Patient Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Name</p>
                <p className="font-bold text-slate-800">{data.profile.name}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Age</p>
                <p className="font-bold text-slate-800">{data.profile.age}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Gender</p>
                <p className="font-bold text-slate-800">{data.profile.gender}</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-slate-500 text-xs">Blood Group</p>
                <p className="font-bold text-slate-800">{data.profile.blood_group}</p>
              </div>
            </div>
          </div>

          {/* Latest Vitals */}
          {data.vitals.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-400">
              <h3 className="font-bold text-lg text-red-600 mb-3">❤️ Latest Vitals</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-50 text-left">
                      <th className="p-2 rounded-l-lg">Date</th>
                      <th className="p-2">BP</th>
                      <th className="p-2">Sugar</th>
                      <th className="p-2 rounded-r-lg">Heart Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vitals.slice(0, 5).map((v, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-2 text-xs text-slate-500">
                          {v.recorded_at ? new Date(v.recorded_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-2 font-semibold">
                          {v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : "—"}
                        </td>
                        <td className="p-2">{v.blood_sugar ?? "—"} mg/dL</td>
                        <td className="p-2">{v.heart_rate ?? "—"} bpm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active Medications = What You're Currently Being Treated For */}
          {data.medications.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
              <h3 className="font-bold text-lg text-green-700 mb-3">💊 Current Conditions & Treatments</h3>
              <p className="text-xs text-slate-500 mb-3">These are your active prescriptions — what your doctor is currently treating you for.</p>
              <div className="space-y-2">
                {data.medications.map((med, i) => (
                  <div key={i} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                    <div>
                      <p className="font-bold text-slate-800">{med.drug_name} <span className="text-xs text-slate-500">({med.dosage})</span></p>
                      <p className="text-sm text-green-700">📋 Reason: {med.condition_for}</p>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Visits / Completed Appointments */}
          {data.past_visits.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
              <h3 className="font-bold text-lg text-blue-700 mb-3">🏥 Recent Completed Visits</h3>
              <div className="space-y-2">
                {data.past_visits.map((visit, i) => (
                  <div key={i} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-800">{visit.name}</p>
                        <p className="text-sm text-blue-700">💬 Symptoms: {visit.symptoms}</p>
                        {visit.diagnosis && (
                          <p className="text-sm text-emerald-700 font-bold mt-1">🩺 Diagnosis: {visit.diagnosis}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {visit.completed_at ? new Date(visit.completed_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Medications */}
          {data.past_medications.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-amber-500">
              <h3 className="font-bold text-lg text-amber-700 mb-3">📜 Past Treatments (Completed)</h3>
              <div className="space-y-2">
                {data.past_medications.map((med, i) => (
                  <div key={i} className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <div>
                      <p className="font-bold text-slate-800">{med.drug_name} <span className="text-xs text-slate-500">({med.dosage})</span></p>
                      <p className="text-sm text-amber-700">📋 Was for: {med.condition_for}</p>
                    </div>
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold">Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Alerts */}
          {data.alerts.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500">
              <h3 className="font-bold text-lg text-orange-700 mb-3">⚠️ Health Alerts</h3>
              <div className="space-y-2">
                {data.alerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm">{alert.alert_type}</p>
                        <p className="text-sm">{alert.message}</p>
                      </div>
                      <span className="text-xs font-bold uppercase">{alert.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diet Summary */}
          <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-teal-500">
            <h3 className="font-bold text-lg text-teal-700 mb-3">🥗 Diet Summary (Last 7 Days)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-teal-50 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-500">Avg Calories</p>
                <p className="font-bold text-lg text-teal-700">{data.diet_summary.avg_calories}</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-500">Avg Protein</p>
                <p className="font-bold text-lg text-teal-700">{data.diet_summary.avg_protein}g</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-500">Avg Carbs</p>
                <p className="font-bold text-lg text-teal-700">{data.diet_summary.avg_carbs}g</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-500">Avg Fat</p>
                <p className="font-bold text-lg text-teal-700">{data.diet_summary.avg_fat}g</p>
              </div>
            </div>
          </div>

          {/* No data fallback */}
          {data.medications.length === 0 && data.vitals.length === 0 && data.past_visits.length === 0 && (
            <div className="card text-center py-6 text-slate-500">
              <p className="text-lg mb-2">📋 No clinical records found yet.</p>
              <p className="text-sm">Your health data will appear here after your doctor records vitals and prescriptions during consultations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
