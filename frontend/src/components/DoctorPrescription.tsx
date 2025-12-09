import { useState } from "react";
import { api } from "../lib/api";

interface DoctorPrescriptionProps {
  patientId: number;
  appointmentId?: number;
  onPrescribeSuccess?: () => void;
}

export default function DoctorPrescription({
  patientId,
  appointmentId,
  onPrescribeSuccess,
}: DoctorPrescriptionProps) {
  const [formData, setFormData] = useState({
    medicine_name: "",
    dosage: "",
    frequency: "",
    duration_days: 7,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration_days" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.medicine_name || !formData.dosage || !formData.frequency) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/medicines/", {
        ...formData,
        user_id: patientId,
        appointment_id: appointmentId || null,
      });

      setSuccess(true);
      setFormData({
        medicine_name: "",
        dosage: "",
        frequency: "",
        duration_days: 7,
        notes: "",
      });

      setTimeout(() => {
        setSuccess(false);
        onPrescribeSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to prescribe medicine. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 bg-slate-50 border-cyan-300">
      <h3 className="text-lg font-bold mb-4">💊 Prescribe Medicine</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">
          ✅ Medicine prescribed successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Medicine Name *
          </label>
          <input
            type="text"
            name="medicine_name"
            value={formData.medicine_name}
            onChange={handleChange}
            placeholder="e.g., Paracetamol, Amoxicillin"
            className="input"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dosage *
            </label>
            <input
              type="text"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              placeholder="e.g., 500mg, 250mg/5ml"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Frequency *
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select frequency</option>
              <option value="Once daily">Once daily</option>
              <option value="2 times daily">2 times daily</option>
              <option value="3 times daily">3 times daily</option>
              <option value="4 times daily">4 times daily</option>
              <option value="Every 4 hours">Every 4 hours</option>
              <option value="Every 6 hours">Every 6 hours</option>
              <option value="Every 8 hours">Every 8 hours</option>
              <option value="Every 12 hours">Every 12 hours</option>
              <option value="As needed">As needed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Duration (Days) *
          </label>
          <input
            type="number"
            name="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            min={1}
            max={365}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g., Take with food, avoid alcohol"
            className="input h-20 resize-none"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Prescribing..." : "Prescribe Medicine"}
        </button>
      </form>
    </div>
  );
}
