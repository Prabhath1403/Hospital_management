import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import Toast from "../components/Toast";
import { authService } from "../lib/auth";

export default function AppointmentBooking() {
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get("doctorId");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    doctorId: doctorIdFromUrl || "",
    departmentId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const doctors = [
    { id: 1, name: "Dr. Aisha Patel — Cardiology" },
    { id: 2, name: "Dr. Miguel Chen — General Medicine" },
    { id: 3, name: "Dr. Sara Khan — Diagnostics" },
  ];

  const departments = [
    { id: 1, name: "Cardiology" },
    { id: 2, name: "General Medicine" },
    { id: 3, name: "Emergency & ICU" },
    { id: 4, name: "Diagnostics" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        phone: user.phone || "",
        doctorId: doctorIdFromUrl || prev.doctorId,
      }));
    }
  }, [doctorIdFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.phone ||
      !formData.doctorId ||
      !formData.departmentId ||
      !formData.appointmentDate ||
      !formData.appointmentTime
    ) {
      setToast({ message: "Please fill in all fields", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const dateTime = `${formData.appointmentDate}T${formData.appointmentTime}`;

      await api.post("/appointments/", {
        name: formData.name,
        phone: formData.phone,
        datetime: dateTime,
        doctorId: parseInt(formData.doctorId),
        departmentId: parseInt(formData.departmentId),
        symptoms: formData.reason || "",
      });

      setToast({
        message: "✅ Appointment booked successfully!",
        type: "success",
      });
      setFormData({
        doctorId: "",
        departmentId: "",
        appointmentDate: "",
        appointmentTime: "",
        reason: "",
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error: any) {
      setToast({
        message: error.response?.data?.detail || "Failed to book appointment",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="section-title text-center mb-8">
          Book Your Appointment
        </h1>

        <form onSubmit={handleSubmit} className="card p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Doctor
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a doctor</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Department
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date
              </label>
              <input
                type="date"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Time
              </label>
              <input
                type="time"
                name="appointmentTime"
                value={formData.appointmentTime}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason (Optional)
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Describe your symptoms or reason for visit"
                className="input h-24 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Booking..." : "📅 Book Appointment"}
            </button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
