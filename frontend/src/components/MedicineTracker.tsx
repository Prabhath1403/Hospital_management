import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  start_date: string;
  notes?: string;
  is_completed: number;
  created_at: string;
}

interface DailyDose {
  id: number;
  medicine_id: number;
  dose_date: string;
  taken: number;
  confirmed_at: string | null;
}

export default function MedicineTracker() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dailyDoses, setDailyDoses] = useState<Record<number, DailyDose[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMedicineId, setExpandedMedicineId] = useState<number | null>(
    null
  );
  const [confirmingDoses, setConfirmingDoses] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Refetch medicines when page comes back into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchMedicines();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await api.get<Medicine[]>("/medicines/patient");
      setMedicines(res.data);

      // Fetch daily doses for each medicine
      const dosesMap: Record<number, DailyDose[]> = {};
      for (const med of res.data) {
        try {
          const dosesRes = await api.get<DailyDose[]>(
            `/medicines/${med.id}/daily-doses`
          );
          dosesMap[med.id] = dosesRes.data;
        } catch (err) {
          console.error(`Failed to fetch doses for medicine ${med.id}:`, err);
        }
      }
      setDailyDoses(dosesMap);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
      setError("Unable to load medicines");
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDose = async (medicineId: number, dateStr: string) => {
    const key = `${medicineId}-${dateStr}`;
    try {
      setConfirmingDoses((prev) => new Set([...prev, key]));

      await api.post(
        `/medicines/${medicineId}/daily-doses/confirm?dose_date_str=${dateStr}`
      );

      // Update the doses in state
      setDailyDoses((prev) => ({
        ...prev,
        [medicineId]: prev[medicineId].map((dose) =>
          dose.dose_date === dateStr
            ? { ...dose, taken: 1, confirmed_at: new Date().toISOString() }
            : dose
        ),
      }));
    } catch (err) {
      console.error("Failed to confirm dose:", err);
      setError("Failed to confirm dose");
    } finally {
      setConfirmingDoses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleMarkComplete = async (medicineId: number) => {
    try {
      await api.patch(`/medicines/${medicineId}/complete`);
      setMedicines((prev) =>
        prev.map((m) => (m.id === medicineId ? { ...m, is_completed: 1 } : m))
      );
    } catch (err) {
      console.error("Failed to mark medicine as complete:", err);
      setError("Failed to update medicine status");
    }
  };

  const calculateDaysLeft = (startDate: string, durationDays: number) => {
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + durationDays);
    const today = new Date();
    const daysLeft = Math.max(
      0,
      Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    return daysLeft;
  };

  const generateDailyDates = (
    startDate: string,
    durationDays: number
  ): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < durationDays; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const getCompliancePercentage = (
    medicineId: number,
    durationDays: number
  ): number => {
    const doses = dailyDoses[medicineId] || [];
    const confirmedDoses = doses.filter((d) => d.taken === 1).length;
    return durationDays > 0
      ? Math.round((confirmedDoses / durationDays) * 100)
      : 0;
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-slate-600 text-sm">Loading medicines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">💊 Medicine Tracker</h2>

      {medicines.length === 0 ? (
        <div className="card">
          <p className="text-slate-600 text-sm">
            No medicines prescribed yet. Consult a doctor for prescriptions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {medicines.map((medicine) => {
            const daysLeft = calculateDaysLeft(
              medicine.start_date,
              medicine.duration_days
            );
            const isCompleted = medicine.is_completed === 1;
            const progressPercent = Math.min(
              100,
              ((medicine.duration_days - daysLeft) / medicine.duration_days) *
                100
            );
            const compliancePercent = getCompliancePercentage(
              medicine.id,
              medicine.duration_days
            );
            const isExpanded = expandedMedicineId === medicine.id;
            const allDates = generateDailyDates(
              medicine.start_date,
              medicine.duration_days
            );
            const medicineDoses = dailyDoses[medicine.id] || [];

            return (
              <div
                key={medicine.id}
                className={`card p-4 border-l-4 ${
                  isCompleted
                    ? "border-green-500 bg-green-50"
                    : "border-cyan-500"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-base">
                      {medicine.medicine_name}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {medicine.dosage} · {medicine.frequency}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      isCompleted
                        ? "bg-green-200 text-green-800"
                        : daysLeft === 0
                        ? "bg-red-200 text-red-800"
                        : daysLeft <= 3
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-blue-200 text-blue-800"
                    }`}
                  >
                    {isCompleted
                      ? "Completed"
                      : daysLeft === 0
                      ? "Ends Today"
                      : `${daysLeft} days left`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600">
                      Overall Progress
                    </span>
                    <span className="text-xs font-semibold text-cyan-600">
                      {Math.round(progressPercent)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {medicine.duration_days - daysLeft} of{" "}
                    {medicine.duration_days} days taken
                  </p>
                </div>

                {/* Compliance Bar */}
                <div className="mb-3 p-2 bg-slate-50 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600">
                      Daily Adherence
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        compliancePercent >= 80
                          ? "text-green-600"
                          : compliancePercent >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {compliancePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        compliancePercent >= 80
                          ? "bg-green-500"
                          : compliancePercent >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${compliancePercent}%` }}
                    ></div>
                  </div>
                </div>

                {medicine.notes && (
                  <p className="text-xs text-slate-600 mb-3 p-2 bg-slate-100 rounded">
                    📝 {medicine.notes}
                  </p>
                )}

                {/* Daily Dose Tracker */}
                <button
                  onClick={() =>
                    setExpandedMedicineId(isExpanded ? null : medicine.id)
                  }
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold mb-2 flex items-center gap-1"
                >
                  {isExpanded ? "▼" : "▶"} Daily Tracker (
                  {medicineDoses.filter((d) => d.taken === 1).length}/
                  {allDates.length})
                </button>

                {isExpanded && (
                  <div className="mb-3 p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="grid grid-cols-7 gap-1">
                      {allDates.map((dateStr) => {
                        const dose = medicineDoses.find(
                          (d) => d.dose_date === dateStr
                        );
                        const isTaken = dose?.taken === 1;
                        const dateObj = new Date(dateStr);
                        const dayName = dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                        const dayNum = dateObj.getDate();
                        const isToday =
                          dateStr === new Date().toISOString().split("T")[0];

                        return (
                          <button
                            key={dateStr}
                            onClick={() =>
                              !isTaken &&
                              handleConfirmDose(medicine.id, dateStr)
                            }
                            disabled={
                              isTaken ||
                              confirmingDoses.has(`${medicine.id}-${dateStr}`)
                            }
                            className={`p-2 rounded text-center text-xs transition-all ${
                              isTaken
                                ? "bg-green-500 text-white"
                                : isToday
                                ? "bg-blue-100 text-blue-700 border-2 border-blue-500 hover:bg-blue-200"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={dateStr}
                          >
                            <div className="font-semibold">{dayName}</div>
                            <div className="text-xs">{dayNum}</div>
                            {isTaken && <div className="text-lg">✓</div>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Click on a date to confirm you took the medicine
                    </p>
                  </div>
                )}

                {!isCompleted && daysLeft > 0 && (
                  <button
                    onClick={() => handleMarkComplete(medicine.id)}
                    className="btn-primary text-xs"
                  >
                    Mark Course as Completed
                  </button>
                )}

                {isCompleted && (
                  <p className="text-xs text-green-700 font-semibold">
                    ✅ Completed on time!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
