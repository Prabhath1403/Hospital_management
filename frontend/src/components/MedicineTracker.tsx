import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  times_of_day?: string;
  start_date: string;
  notes?: string;
  is_completed: number;
  created_at: string;
}

interface DailyDose {
  id: number;
  medicine_id: number;
  dose_date: string;
  time_of_day?: string;
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

  const handleConfirmDose = async (medicineId: number, dateStr: string, timeOfDay: string) => {
    const key = `${medicineId}-${dateStr}-${timeOfDay}`;
    try {
      setConfirmingDoses((prev) => new Set([...prev, key]));

      const timeQuery = timeOfDay !== "Regular Dose" ? `&time_of_day=${encodeURIComponent(timeOfDay)}` : "";
      await api.post(
        `/medicines/${medicineId}/daily-doses/confirm?dose_date_str=${dateStr}${timeQuery}`
      );

      // Update the doses in state
      setDailyDoses((prev) => {
        const currentDoses = prev[medicineId] || [];
        const existingIndex = currentDoses.findIndex(
           (d) => d.dose_date === dateStr && (d.time_of_day === timeOfDay || (!d.time_of_day && timeOfDay === "Regular Dose"))
        );
        
        let newDoses;
        if (existingIndex >= 0) {
           newDoses = [...currentDoses];
           newDoses[existingIndex] = { ...newDoses[existingIndex], taken: 1, confirmed_at: new Date().toISOString() };
        } else {
           newDoses = [...currentDoses, { id: Date.now(), medicine_id: medicineId, dose_date: dateStr, time_of_day: timeOfDay, taken: 1, confirmed_at: new Date().toISOString() }];
        }
        
        return {
          ...prev,
          [medicineId]: newDoses,
        };
      });
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
    durationDays: number,
    timesCount: number
  ): number => {
    const doses = dailyDoses[medicineId] || [];
    const confirmedDoses = doses.filter((d) => d.taken === 1).length;
    const totalExpected = durationDays * timesCount;
    return totalExpected > 0
      ? Math.round((confirmedDoses / totalExpected) * 100)
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
            
            let progressPercent = Math.min(
              100,
              ((medicine.duration_days - daysLeft) / medicine.duration_days) *
                100
            );
            
            let daysTaken = medicine.duration_days - daysLeft;
            
            // Override visually if they manually completed the entire course early
            if (isCompleted) {
              progressPercent = 100;
              daysTaken = medicine.duration_days;
            }

            const times = medicine.times_of_day ? medicine.times_of_day.split(",").map(t => t.trim()) : ["Regular Dose"];

            const compliancePercent = getCompliancePercentage(
              medicine.id,
              medicine.duration_days,
              times.length
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
                    {daysTaken} of{" "}
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
                  {allDates.length * times.length})
                </button>

                {isExpanded && (
                  <div className="mb-3 p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {allDates.map((dateStr) => {
                        const dateObj = new Date(dateStr);
                        const dayName = dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                        const dayNum = dateObj.getDate();
                        const isToday =
                          dateStr === new Date().toISOString().split("T")[0];

                        return (
                          <div key={dateStr} className={`border bg-white rounded p-2 text-center flex flex-col ${isToday ? 'border-blue-400 ring-1 ring-blue-400' : 'border-slate-200'}`}>
                             <div className={`font-bold text-xs p-1 rounded mb-2 ${isToday ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                                {dayName} {dayNum}
                             </div>
                             <div className="flex flex-col gap-1 flex-1">
                                {times.map((t) => {
                                   const dose = medicineDoses.find((d) => d.dose_date === dateStr && (d.time_of_day === t || (!d.time_of_day && t === "Regular Dose")));
                                   const isTaken = dose?.taken === 1;
                                   
                                   return (
                                     <button
                                       key={t}
                                       onClick={() => !isTaken && handleConfirmDose(medicine.id, dateStr, t)}
                                       disabled={isTaken || confirmingDoses.has(`${medicine.id}-${dateStr}-${t}`)}
                                       className={`px-1 py-1 rounded text-[0.65rem] font-semibold transition-colors ${
                                         isTaken ? "bg-green-500 text-white" : "bg-slate-200 text-slate-700 hover:bg-cyan-100"
                                       } disabled:opacity-50`}
                                     >
                                       {isTaken ? `✓ ${t}` : t}
                                     </button>
                                   )
                                })}
                             </div>
                          </div>
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
