import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { authService } from "../lib/auth";

interface PendingTest {
  id: number;
  patient_name: string;
  doctor_name: string;
  test_name: string;
  reason: string;
  requested_at: string;
}

export default function LabDashboard() {
  const [tests, setTests] = useState<PendingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeUploadId, setActiveUploadId] = useState<number | null>(null);
  const [resultData, setResultData] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchPendingTests = async () => {
    try {
      const res = await api.get("/api/diagnostics/pending");
      setTests(res.data);
      setError(null);
    } catch (err: any) {
      setError("Failed to fetch pending requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTests();
  }, []);

  const handleUpload = async () => {
    if (!activeUploadId || !resultData.trim()) return;
    setUploading(true);
    try {
      const user = authService.getUser();
      await api.post(`/api/diagnostics/${activeUploadId}/result`, {
        technician_id: user?.id || 0,
        result_data: resultData,
      });
      setResultData("");
      setActiveUploadId(null);
      fetchPendingTests(); // Refresh queue
    } catch (err: any) {
      alert("Failed to upload test results.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-indigo-400">Loading queue...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            🔬 Diagnostics Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Manage pending lab orders and upload patient results.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold px-4 py-2 rounded-lg">
          Pending: {tests.length}
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-6">{error}</div>}

      <div className="space-y-4">
        {tests.length === 0 && !error ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 text-gray-500">
            ✅ No pending lab tests. All clear!
          </div>
        ) : (
          tests.map((test) => (
            <div key={test.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Pending
                    </span>
                    <span className="text-sm text-gray-400">
                      Req ID: #{test.id} • {new Date(test.requested_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {test.test_name}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block">Patient</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{test.patient_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block">Ordered By</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{test.doctor_name}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 text-sm inline-block">
                    <span className="font-semibold text-blue-800 dark:text-blue-300">Reason:</span>{" "}
                    <span className="text-blue-700 dark:text-blue-200">{test.reason}</span>
                  </div>
                </div>

                <div className="md:min-w-[400px]">
                  {activeUploadId === test.id ? (
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Enter Findings / Interpretation
                      </label>
                      <textarea
                        value={resultData}
                        onChange={(e) => setResultData(e.target.value)}
                        placeholder='e.g., {"Total Cholesterol": "210 mg/dL", "Status": "High"}'
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm mb-3 h-32 font-mono"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setActiveUploadId(null);
                            setResultData("");
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={uploading || !resultData.trim()}
                          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                        >
                          {uploading ? "Submitting..." : "Submit Result"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveUploadId(test.id)}
                      className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-md inline-flex items-center justify-center gap-2"
                    >
                      <span>📝</span> Upload Result
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
