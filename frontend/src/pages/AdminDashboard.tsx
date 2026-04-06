import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
}

interface Stats {
  users: { patients: number; doctors: number; lab_techs: number };
  appointments: { total: number; completed: number; scheduled: number };
  lab_tests: { total: number; completed: number; pending: number };
  day_wise_reports: { date: string; total: number; completed: number; no_show: number }[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"analytics" | "list" | "doctor" | "lab" | "patients">("analytics");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // Forms
  const [docForm, setDocForm] = useState({
    name: "", email: "", password: "", phone: "", specialty: "", experience: "", fee: ""
  });
  const [labForm, setLabForm] = useState({
    name: "", email: "", password: "", phone: ""
  });

  // Patient Search State
  const [searchQ, setSearchQ] = useState("");
  const [patientResults, setPatientResults] = useState<StaffUser[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/users");
      setUsers(res.data);
    } catch {
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/system-stats");
      setStats(res.data);
    } catch {
      alert("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") fetchUsers();
    if (activeTab === "analytics") fetchStats();
  }, [activeTab]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/doctors", docForm);
      alert("Doctor account created successfully!");
      setDocForm({ name: "", email: "", password: "", phone: "", specialty: "", experience: "", fee: "" });
      setActiveTab("list");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create doctor");
    }
  };

  const handleCreateLabTech = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/labs", labForm);
      alert("Lab Technician account created successfully!");
      setLabForm({ name: "", email: "", password: "", phone: "" });
      setActiveTab("list");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create lab technician");
    }
  };

  const handlePatientSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQ.trim()) return;
    
    setSearchLoading(true);
    setSelectedPatient(null);
    setPatientHistory(null);
    try {
      const res = await api.get(`/api/admin/patients/search?q=${encodeURIComponent(searchQ)}`);
      setPatientResults(res.data);
    } catch {
      alert("Failed to search patients");
    } finally {
      setSearchLoading(false);
    }
  };

  const loadPatientHistory = async (patient: any) => {
    setSelectedPatient(patient);
    setPatientHistory(null);
    try {
      const res = await api.get(`/api/admin/patients/${patient.id}/history`);
      setPatientHistory(res.data);
    } catch {
      alert("Failed to load patient history");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          🛡️ Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-2">Manage hospital staff and access controls.</p>
      </div>

      <div className="flex gap-4 mb-6 text-sm font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === "analytics" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === "list" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
        >
          🧑‍⚕️ Staff Directory
        </button>
        <button
          onClick={() => setActiveTab("patients")}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap flex-shrink-0 ${activeTab === "patients" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
        >
          📂 Patient Database
        </button>
        <button
          onClick={() => setActiveTab("doctor")}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === "doctor" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
        >
          + Add Doctor
        </button>
        <button
          onClick={() => setActiveTab("lab")}
          className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${activeTab === "lab" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
        >
          + Add Lab Technician
        </button>
      </div>

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {loading && !stats ? (
             <div className="animate-pulse space-y-4">
               <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded-2xl w-full"></div>
             </div>
          ) : stats ? (
            <>
              {/* Users Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
                    <p className="text-3xl font-bold mt-1 dark:text-white">{stats.users.patients}</p>
                  </div>
                  <div className="text-3xl">👤</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium">Active Doctors</h3>
                    <p className="text-3xl font-bold mt-1 dark:text-blue-400 text-blue-600">{stats.users.doctors}</p>
                  </div>
                  <div className="text-3xl">🩺</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-500 text-sm font-medium">Lab Technicians</h3>
                    <p className="text-3xl font-bold mt-1 dark:text-orange-400 text-orange-600">{stats.users.lab_techs}</p>
                  </div>
                  <div className="text-3xl">🔬</div>
                </div>
              </div>

              {/* Progress Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Appointments */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Appointments Workflow</h3>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-3xl font-bold dark:text-white">{stats.appointments.total}</p>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Total Booked</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-500">{stats.appointments.completed}</p>
                      <p className="text-xs text-gray-500 font-medium">Completed</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mt-4">
                    <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${stats.appointments.total > 0 ? (stats.appointments.completed / stats.appointments.total) * 100 : 0}%` }}></div>
                  </div>
                  <p className="text-sm mt-3 text-gray-500">{stats.appointments.scheduled} pending consultations</p>
                </div>

                {/* Lab Tests */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold mb-4 dark:text-white">Diagnostic Lab Pipeline</h3>
                  <div className="flex justify-between items-end mb-2">
                     <div>
                      <p className="text-3xl font-bold dark:text-white">{stats.lab_tests.total}</p>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Tests Ordered</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-500">{stats.lab_tests.completed}</p>
                      <p className="text-xs text-gray-500 font-medium">Results Uploaded</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mt-4">
                    <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${stats.lab_tests.total > 0 ? (stats.lab_tests.completed / stats.lab_tests.total) * 100 : 0}%` }}></div>
                  </div>
                  <p className="text-sm mt-3 text-gray-500">{stats.lab_tests.pending} pending tests awaiting results</p>
                </div>
              </div>

              {/* Day-wise Trends */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm mt-6">
                <h3 className="text-lg font-bold mb-4 dark:text-white">Past 7 Days Appointment Trend</h3>
                {stats.day_wise_reports.length === 0 ? (
                  <p className="text-gray-500 text-sm">No activity in the past 7 days.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500 text-xs">
                          <th className="py-2 px-4 font-semibold uppercase">Date</th>
                          <th className="py-2 px-4 font-semibold uppercase">Scheduled</th>
                          <th className="py-2 px-4 font-semibold uppercase">Completed</th>
                          <th className="py-2 px-4 font-semibold uppercase text-red-500">No-Shows</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.day_wise_reports.map((report, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 text-sm">
                            <td className="py-3 px-4 font-medium dark:text-gray-200">{report.date}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-bold">{report.total}</td>
                            <td className="py-3 px-4 text-green-600 font-bold">{report.completed}</td>
                            <td className="py-3 px-4 text-red-500 font-bold">{report.no_show}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {activeTab === "list" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          {loading ? (
            <div className="animate-pulse flex space-x-4">Loading staff directory...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500">
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium">{u.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase
                          ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            u.role === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{u.phone || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "patients" && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Patient Search</h2>
            <form onSubmit={handlePatientSearch} className="flex gap-4">
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                className="flex-1 border p-3 rounded-xl focus:ring-2 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              <button disabled={searchLoading} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition">
                {searchLoading ? "Searching..." : "Search"}
              </button>
            </form>

            {/* Results */}
            {patientResults.length > 0 && !selectedPatient && (
              <div className="mt-6 border-t border-gray-100 dark:border-slate-700 pt-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Matches found</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patientResults.map(p => (
                    <div key={p.id} onClick={() => loadPatientHistory(p)} className="p-4 border border-gray-200 dark:border-slate-600 rounded-xl cursor-pointer hover:border-indigo-400 hover:shadow-md transition bg-gray-50 dark:bg-slate-700/50">
                      <p className="font-bold text-lg dark:text-white">{p.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{p.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{p.phone}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Master Record Viewer */}
          {selectedPatient && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-md border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-8 border-b border-gray-200 dark:border-slate-700 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 dark:text-white">{selectedPatient.name}</h2>
                  <p className="text-gray-500">{selectedPatient.email} • {selectedPatient.phone}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-gray-500 hover:text-gray-800 font-bold bg-gray-100 px-4 py-2 rounded-lg">Close Record</button>
              </div>

              {!patientHistory ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Vitals */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 dark:text-white border-l-4 border-indigo-500 pl-3">Recent Vitals</h3>
                    {patientHistory.vitals.length === 0 ? <p className="text-gray-500 text-sm">No vitals recorded.</p> : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-xl">
                          <p className="text-xs text-blue-500 uppercase font-bold">Blood Pressure</p>
                          <p className="text-xl font-bold dark:text-white mt-1">{patientHistory.vitals[0].bp_systolic}/{patientHistory.vitals[0].bp_diastolic}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-slate-900 p-4 rounded-xl">
                          <p className="text-xs text-red-500 uppercase font-bold">Heart Rate</p>
                          <p className="text-xl font-bold dark:text-white mt-1">{patientHistory.vitals[0].heart_rate} bpm</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-slate-900 p-4 rounded-xl">
                          <p className="text-xs text-yellow-600 uppercase font-bold">Blood Sugar</p>
                          <p className="text-xl font-bold dark:text-white mt-1">{patientHistory.vitals[0].blood_sugar} mg/dL</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Medications */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 dark:text-white border-l-4 border-emerald-500 pl-3">Active Prescriptions</h3>
                    {patientHistory.medications.length === 0 ? <p className="text-gray-500 text-sm">No active medications.</p> : (
                      <ul className="space-y-2">
                        {patientHistory.medications.map((m: any, i: number) => (
                          <li key={i} className="flex gap-4 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl">
                            <div>
                              <p className="font-bold text-emerald-600">{m.drug_name}</p>
                              <p className="text-sm dark:text-gray-300">{m.dosage}</p>
                            </div>
                            <div className="border-l border-gray-200 dark:border-slate-700 pl-4">
                              <p className="text-xs text-gray-500 mt-1 uppercase">Reason</p>
                              <p className="text-sm dark:text-gray-300">{m.condition_for}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Diet */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 dark:text-white border-l-4 border-orange-500 pl-3">Diet Summary (Last 7 Days)</h3>
                    <div className="flex flex-wrap gap-4">
                      {["calories", "protein", "carbs", "fat"].map(macro => (
                        <div key={macro} className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-4 rounded-xl text-center min-w-[120px]">
                          <p className="text-xs text-gray-500 uppercase font-bold">{macro}</p>
                          <p className="text-xl font-bold dark:text-white mt-1">{patientHistory.diet_summary[`avg_${macro}`]} {macro === "calories" ? "kcal" : "g"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "doctor" && (
        <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Add New Doctor</h2>
          <form onSubmit={handleCreateDoctor} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required className="w-full border p-2 rounded focus:ring-2" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" className="w-full border p-2 rounded focus:ring-2" value={docForm.email} onChange={e => setDocForm({...docForm, email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input required type="password" className="w-full border p-2 rounded focus:ring-2" value={docForm.password} onChange={e => setDocForm({...docForm, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input required className="w-full border p-2 rounded focus:ring-2" value={docForm.phone} onChange={e => setDocForm({...docForm, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Specialty</label>
                <input required placeholder="e.g. Cardiology" className="w-full border p-2 rounded focus:ring-2" value={docForm.specialty} onChange={e => setDocForm({...docForm, specialty: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Experience</label>
                <input required placeholder="e.g. 10 yrs" className="w-full border p-2 rounded focus:ring-2" value={docForm.experience} onChange={e => setDocForm({...docForm, experience: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Consultation Fee</label>
                <input required placeholder="e.g. $50" className="w-full border p-2 rounded focus:ring-2" value={docForm.fee} onChange={e => setDocForm({...docForm, fee: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 pt-4 rounded-lg mt-4 transition">
              Create Doctor Account
            </button>
          </form>
        </div>
      )}

      {activeTab === "lab" && (
        <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Add New Lab Technician</h2>
          <form onSubmit={handleCreateLabTech} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required className="w-full border p-2 rounded focus:ring-2" value={labForm.name} onChange={e => setLabForm({...labForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" className="w-full border p-2 rounded focus:ring-2" value={labForm.email} onChange={e => setLabForm({...labForm, email: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input required type="password" className="w-full border p-2 rounded focus:ring-2" value={labForm.password} onChange={e => setLabForm({...labForm, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input required className="w-full border p-2 rounded focus:ring-2" value={labForm.phone} onChange={e => setLabForm({...labForm, phone: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 pt-4 rounded-lg mt-4 transition">
              Create Lab Technician Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
