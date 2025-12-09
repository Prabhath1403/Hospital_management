import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { authService } from "../lib/auth";

interface Appointment {
  id: number;
  name: string;
  phone: string;
  datetime: string;
  doctor_id: number;
  department_id: number;
  symptoms: string;
  user_id: number;
  status?: string;
  completed_at?: string;
}

interface Medicine {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  start_date: string;
  created_at: string;
  is_completed: number;
  notes: string;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  days_elapsed: number;
}

interface Analytics {
  total_medicines_prescribed: number;
  completed: number;
  incomplete: number;
  overall_compliance: number;
  patient_analytics: Record<
    string,
    {
      patient_name: string;
      total_prescribed: number;
      completed: number;
      compliance: number;
    }
  >;
}

interface PrescriptionForm {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  notes: string;
}

export default function DoctorConsole() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "appointments" | "prescriptions" | "analytics"
  >("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [formData, setFormData] = useState<PrescriptionForm>({
    medicine_name: "",
    dosage: "",
    frequency: "Daily",
    duration_days: 7,
    notes: "",
  });
  const [prescribing, setPrescribing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [completingAppointmentId, setCompletingAppointmentId] = useState<
    number | null
  >(null);

  // Check if user is a doctor
  useEffect(() => {
    const user = authService.getUser();
    if (!user || user.role !== "doctor") {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("=== Starting fetchData ===");
      console.log("Fetching doctor data...");

      // Fetch appointments
      console.log("Fetching /appointments/doctor...");
      const apptRes = await api.get("/appointments/doctor");
      console.log("✓ Appointments response received:", apptRes.data);
      console.log("  Type:", typeof apptRes.data);
      console.log("  Is Array:", Array.isArray(apptRes.data));
      console.log("  Length:", apptRes.data?.length);

      // Fetch medicines
      console.log("Fetching /medicines/doctor/patients-medicines...");
      const medRes = await api.get("/medicines/doctor/patients-medicines");
      console.log("✓ Medicines response received:", medRes.data);

      // Fetch analytics
      console.log("Fetching /medicines/doctor/analytics...");
      const analyticsRes = await api.get("/medicines/doctor/analytics");
      console.log("✓ Analytics response received:", analyticsRes.data);

      console.log("=== Setting state ===");
      console.log("Setting appointments to:", apptRes.data);
      setAppointments(apptRes.data || []);
      setMedicines(medRes.data || []);
      setAnalytics(analyticsRes.data || null);

      console.log("=== State set complete ===");
    } catch (error: any) {
      console.error("❌ Error fetching doctor data:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data || error.message);

      // Set default values on error
      setAppointments([]);
      setMedicines([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
      console.log("=== fetchData complete ===");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refetch data when page comes back into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handlePrescribe = async () => {
    if (
      !selectedAppointment ||
      !formData.medicine_name ||
      !formData.dosage ||
      !formData.frequency
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setPrescribing(true);
      await api.post("/medicines/", {
        medicine_name: formData.medicine_name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration_days: formData.duration_days,
        user_id: selectedAppointment.user_id,
        appointment_id: selectedAppointment.id,
        notes: formData.notes,
      });

      setSuccessMsg(`✅ Medicine prescribed to ${selectedAppointment.name}`);
      setShowPrescriptionModal(false);
      setFormData({
        medicine_name: "",
        dosage: "",
        frequency: "Daily",
        duration_days: 7,
        notes: "",
      });

      // Refresh all data
      fetchData();

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Error prescribing medicine:", error);
      alert("Failed to prescribe medicine");
    } finally {
      setPrescribing(false);
    }
  };

  const openPrescriptionModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowPrescriptionModal(true);
  };

  const handleCompleteAppointment = async (appointmentId: number) => {
    try {
      setCompletingAppointmentId(appointmentId);
      await api.patch(`/appointments/${appointmentId}/complete`);

      setSuccessMsg("✅ Appointment marked as completed");

      // Refresh data
      fetchData();

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Error completing appointment:", error);
      alert("Failed to complete appointment");
    } finally {
      setCompletingAppointmentId(null);
    }
  };

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getComplianceColor = (compliance: number) => {
    if (compliance >= 80) return "text-green-600";
    if (compliance >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Doctor Console
          </h1>
          <p className="text-gray-600">
            Manage appointments, prescribe medicines, and track patient
            compliance
          </p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg border border-green-300">
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${
              activeTab === "appointments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            📅 Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${
              activeTab === "prescriptions"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            💊 Prescriptions ({medicines.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${
              activeTab === "analytics"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {/* Content */}
        {activeTab === "appointments" && (
          <div className="grid gap-4">
            {appointments.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                No upcoming appointments
              </div>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">
                          {appointment.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${
                            appointment.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {appointment.status === "completed"
                            ? "✅ Completed"
                            : "📅 Scheduled"}
                        </span>
                      </div>
                      <p className="text-gray-600">📞 {appointment.phone}</p>
                      <p className="text-gray-500 text-sm mt-2">
                        📅 {formatDateTime(appointment.datetime)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-col">
                      {appointment.status !== "completed" && (
                        <button
                          onClick={() => openPrescriptionModal(appointment)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                        >
                          💊 Add Prescription
                        </button>
                      )}
                      {appointment.status !== "completed" && (
                        <button
                          onClick={() =>
                            handleCompleteAppointment(appointment.id)
                          }
                          disabled={completingAppointmentId === appointment.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50"
                        >
                          {completingAppointmentId === appointment.id
                            ? "Completing..."
                            : "✅ Complete"}
                        </button>
                      )}
                    </div>
                  </div>
                  {appointment.symptoms && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Symptoms:</strong> {appointment.symptoms}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="grid gap-4">
            {medicines.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
                No prescriptions yet
              </div>
            ) : (
              medicines.map((med) => (
                <div key={med.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {med.medicine_name}
                      </h3>
                      <p className="text-gray-600 font-semibold">
                        Patient: {med.patient_name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        📞 {med.patient_phone}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        med.is_completed === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {med.is_completed === 1 ? "✅ Completed" : "⏳ Active"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-gray-500">Dosage</p>
                      <p className="font-semibold text-gray-800">
                        {med.dosage}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-gray-500">Frequency</p>
                      <p className="font-semibold text-gray-800">
                        {med.frequency}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-800">
                        {med.duration_days} days
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-gray-500">Days Continued</p>
                      <p className="font-semibold text-gray-800">
                        {med.days_elapsed} days
                      </p>
                    </div>
                  </div>
                  {med.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {med.notes}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-400">
                    Prescribed: {new Date(med.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "analytics" && analytics && (
          <div className="grid gap-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-sm mb-2">Total Prescribed</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.total_medicines_prescribed}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-sm mb-2">Completed</p>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.completed}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-sm mb-2">Still Active</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {analytics.incomplete}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500 text-sm mb-2">Overall Compliance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.overall_compliance.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Patient-wise Analytics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Patient-wise Compliance
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics.patient_analytics).map(
                  ([_, data]) => (
                    <div
                      key={_}
                      className="border-l-4 border-blue-400 pl-4 py-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {data.patient_name}
                        </h4>
                        <span
                          className={`text-lg font-bold ${getComplianceColor(
                            data.compliance
                          )}`}
                        >
                          {data.compliance.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              data.compliance >= 80
                                ? "bg-green-500"
                                : data.compliance >= 50
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${data.compliance}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {data.completed} / {data.total_prescribed} medicines
                        completed
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Prescribe Medicine for {selectedAppointment.name}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Medicine Name *
                </label>
                <input
                  type="text"
                  value={formData.medicine_name}
                  onChange={(e) =>
                    setFormData({ ...formData, medicine_name: e.target.value })
                  }
                  placeholder="e.g., Aspirin, Ibuprofen"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage: e.target.value })
                  }
                  placeholder="e.g., 100mg, 500mg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Once Daily</option>
                  <option>Twice Daily</option>
                  <option>Thrice Daily</option>
                  <option>Every 4 Hours</option>
                  <option>Every 6 Hours</option>
                  <option>Every 8 Hours</option>
                  <option>Every 12 Hours</option>
                  <option>As Needed</option>
                  <option>Once Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_days: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="e.g., Take with food, before bedtime"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={prescribing}
              >
                Cancel
              </button>
              <button
                onClick={handlePrescribe}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                disabled={prescribing}
              >
                {prescribing ? "Prescribing..." : "✅ Prescribe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
