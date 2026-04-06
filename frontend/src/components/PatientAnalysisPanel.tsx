import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";

interface PatientAnalysisPanelProps {
  patientId: number;
  doctorId: number;
  onClose?: () => void;
}

interface OverallStatus {
  summary: string;
  condition_trend: string;
  critical_flag: boolean;
}

interface RiskFactor {
  factor: string;
  evidence: string;
  severity: string;
}

interface MedicationConcern {
  concern: string;
  drugs_involved: string[];
  recommendation: string;
}

interface DietAssessment {
  summary: string;
  concerns: string;
  suggestion: string;
}

interface FollowUp {
  action: string;
  reason: string;
  priority: string;
}

interface AnalysisResult {
  overall_status: OverallStatus;
  risk_factors: RiskFactor[];
  medication_concerns: MedicationConcern[];
  diet_assessment: DietAssessment;
  recommended_followup: FollowUp[];
  disclaimer: string;
}

const severityColor: Record<string, string> = {
  Low: "bg-green-100 text-green-700 border-green-300",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  High: "bg-orange-100 text-orange-700 border-orange-300",
  Critical: "bg-red-100 text-red-700 border-red-300",
};

const priorityColor: Record<string, string> = {
  Routine: "bg-blue-100 text-blue-700 border-blue-300",
  Urgent: "bg-orange-100 text-orange-700 border-orange-300",
  Immediate: "bg-red-100 text-red-700 border-red-300",
};

const trendIcon: Record<string, string> = {
  Improving: "📈",
  Stable: "➡️",
  Deteriorating: "📉",
};

/* ------------------------------------------------------------------ */
/* Loading skeleton component                                         */
/* ------------------------------------------------------------------ */
function AnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/60 rounded-xl p-6 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export default function PatientAnalysisPanel({
  patientId,
  doctorId,
  onClose,
}: PatientAnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- WebSocket listener ---- */
  useEffect(() => {
    const wsUrl =
      (import.meta as any).env?.VITE_WS_URL || "ws://localhost:9001";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (
          msg.type === "PATIENT_ANALYSIS" &&
          msg.doctor_id === doctorId &&
          msg.patient_id === patientId
        ) {
          setAnalysis(msg.analysis);
          setLoading(false);
          // Stop polling if active
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    return () => {
      ws.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [doctorId, patientId]);

  /* ---- Fallback polling for task result ---- */
  const startPolling = useCallback(
    (tid: string) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.get(
            `/api/patients/analysis/status/${tid}`
          );
          if (res.data.status === "SUCCESS" && res.data.result?.analysis) {
            setAnalysis(res.data.result.analysis);
            setLoading(false);
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (res.data.status === "FAILURE") {
            setError("Analysis failed. Please try again.");
            setLoading(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          // keep polling
        }
      }, 3000);
    },
    []
  );

  /* ---- Trigger analysis ---- */
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await api.post(
        `/api/patients/${patientId}/analyze?doctor_id=${doctorId}`
      );
      setTaskId(res.data.task_id);
      // Start fallback polling in case WebSocket misses the message
      startPolling(res.data.task_id);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to queue analysis");
      setLoading(false);
    }
  };

  /* ---- Render ---- */
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border border-indigo-200 shadow-xl p-6 space-y-5 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧠</span>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              AI Patient Analysis
            </h2>
            <p className="text-xs text-gray-500">
              Powered by LLaMA 3.3 70B via Groq
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !analysis && (
            <button
              onClick={handleAnalyze}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl 
                         hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm
                         shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]"
            >
              ✨ Analyze with AI
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && <AnalysisSkeleton />}

      {/* Results */}
      {analysis && (
        <div className="space-y-5">
          {/* ===== Overall Status ===== */}
          <div
            className={`rounded-xl p-5 border ${
              analysis.overall_status.critical_flag
                ? "bg-red-50 border-red-300"
                : "bg-white border-gray-200"
            }`}
          >
            {analysis.overall_status.critical_flag && (
              <div className="mb-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
                🚨 CRITICAL FLAG — Immediate attention recommended
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-800">
                Overall Status
              </h3>
              <span className="text-lg">
                {trendIcon[analysis.overall_status.condition_trend] || ""}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  analysis.overall_status.condition_trend === "Improving"
                    ? "bg-green-100 text-green-700"
                    : analysis.overall_status.condition_trend ===
                      "Deteriorating"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {analysis.overall_status.condition_trend}
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">
              {analysis.overall_status.summary}
            </p>
          </div>

          {/* ===== Risk Factors ===== */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              ⚡ Risk Factors
            </h3>
            {analysis.risk_factors.length === 0 ? (
              <p className="text-sm text-gray-500">No risk factors identified</p>
            ) : (
              <div className="space-y-3">
                {analysis.risk_factors.map((rf, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold border whitespace-nowrap ${
                        severityColor[rf.severity] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {rf.severity}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {rf.factor}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {rf.evidence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Medication Concerns ===== */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              💊 Medication Concerns
            </h3>
            {analysis.medication_concerns.length === 0 ? (
              <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                ✅ No concerns flagged
              </p>
            ) : (
              <div className="space-y-3">
                {analysis.medication_concerns.map((mc, i) => (
                  <div
                    key={i}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <p className="font-semibold text-gray-800 text-sm">
                      {mc.concern}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">Drugs:</span>{" "}
                      {mc.drugs_involved.join(", ")}
                    </p>
                    <p className="text-xs text-indigo-700 mt-1">
                      <span className="font-medium">Recommendation:</span>{" "}
                      {mc.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Recommended Follow-up ===== */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📋 Recommended Follow-up
            </h3>
            {analysis.recommended_followup.length === 0 ? (
              <p className="text-sm text-gray-500">
                No follow-up actions recommended
              </p>
            ) : (
              <div className="space-y-3">
                {analysis.recommended_followup.map((fu, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold border whitespace-nowrap ${
                        priorityColor[fu.priority] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {fu.priority}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {fu.action}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {fu.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Diet Assessment ===== */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              🥗 Diet Assessment
            </h3>
            <p className="text-sm text-gray-700">{analysis.diet_assessment.summary}</p>
            {analysis.diet_assessment.concerns && (
              <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg">
                <span className="font-medium">⚠️ Concern:</span>{" "}
                {analysis.diet_assessment.concerns}
              </p>
            )}
            {analysis.diet_assessment.suggestion && (
              <p className="text-xs text-green-700 mt-2 bg-green-50 p-2 rounded-lg">
                <span className="font-medium">💡 Suggestion:</span>{" "}
                {analysis.diet_assessment.suggestion}
              </p>
            )}
          </div>

          {/* ===== Disclaimer ===== */}
          <p className="text-xs text-gray-400 italic text-center pt-2 border-t border-gray-100">
            {analysis.disclaimer}
          </p>

          {/* Re-analyze button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleAnalyze}
              className="px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg 
                         hover:bg-indigo-50 transition font-medium"
            >
              🔄 Re-analyze
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
