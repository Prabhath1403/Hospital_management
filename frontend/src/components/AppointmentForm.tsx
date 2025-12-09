import { useState } from "react";
import { api } from "../lib/api";

type Option = { id: string; name: string };

export default function AppointmentForm({
  doctors = [],
  departments = [],
}: {
  doctors?: Option[];
  departments?: Option[];
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    datetime: "",
    doctorId: "",
    departmentId: "",
    symptoms: "",
    payment: "",
  });
  const [status, setStatus] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");
    try {
      const payload = {
        ...form,
        doctorId: form.doctorId ? parseInt(form.doctorId) : null,
        departmentId: form.departmentId ? parseInt(form.departmentId) : null,
        datetime: form.datetime ? new Date(form.datetime).toISOString() : null,
      };
      await api.post("/appointments", payload);
      setStatus("Booked! We will confirm shortly.");
      setForm({
        name: "",
        phone: "",
        datetime: "",
        doctorId: "",
        departmentId: "",
        symptoms: "",
        payment: "",
      });
    } catch (err: any) {
      setStatus(
        `Error: ${
          err.response?.data?.detail || "Could not book. Please try again."
        }`
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={submit} className="card grid gap-3">
      <div className="grid md:grid-cols-2 gap-3">
        <input
          name="name"
          placeholder="Full name"
          className="input"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Phone"
          className="input"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          type="datetime-local"
          name="datetime"
          className="input"
          value={form.datetime}
          onChange={handleChange}
          required
        />
        <select
          name="doctorId"
          className="input"
          value={form.doctorId}
          onChange={handleChange}
        >
          <option value="">Select Doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          name="departmentId"
          className="input"
          value={form.departmentId}
          onChange={handleChange}
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          name="payment"
          placeholder="Payment option (UPI / card)"
          className="input"
          value={form.payment}
          onChange={handleChange}
        />
      </div>
      <textarea
        name="symptoms"
        placeholder="Describe symptoms"
        className="input"
        rows={3}
        value={form.symptoms}
        onChange={handleChange}
      />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary">
          Book Appointment
        </button>
        {status && <span className="text-sm text-slate-500">{status}</span>}
      </div>
    </form>
  );
}
