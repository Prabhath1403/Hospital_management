import { useNavigate } from "react-router-dom";
import { authService } from "../lib/auth";
import { api } from "../lib/api";
import { useEffect, useState } from "react";
import MedicineTracker from "../components/MedicineTracker";

interface Appointment {
  id: number;
  name: string;
  phone: string;
  datetime: string;
  doctorId?: number;
  departmentId?: number;
  userId?: number;
  symptoms?: string;
  payment?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
    // Redirect doctors to doctor console
    if (isAuthenticated && user?.role === "doctor") {
      navigate("/doctor-console", { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUpcomingAppointments();
    }
  }, [isAuthenticated]);

  // Refetch appointments when page comes back into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        fetchUpcomingAppointments();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated]);

  const fetchUpcomingAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get<Appointment[]>("/appointments/upcoming");
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  // Show loading or nothing while checking auth
  if (!isAuthenticated) {
    return null;
  }

  const isDoctor = user?.role === "doctor";

  // Don't render anything if doctor - they're being redirected
  if (isDoctor) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Dashboard Header with Home Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {isDoctor ? "Doctor Console" : "Dashboard"}
          </h1>
          <p className="text-slate-600">Welcome back, {user?.name}!</p>
        </div>
        <button
          onClick={handleHomeClick}
          className="btn-primary flex items-center gap-2"
        >
          <span>🏠</span>
          <span>Home</span>
        </button>
      </div>

      {!isDoctor && (
        <>
          {/* Dashboard Content - Only for Patients */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats Cards */}
            <div className="card">
              <div className="text-sm text-slate-600 mb-1">Appointments</div>
              <div className="text-2xl font-bold text-primary">
                {appointments.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Upcoming appointments
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-slate-600 mb-1">Test Results</div>
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-slate-500 mt-1">
                Available results
              </div>
            </div>

            <div className="card">
              <div className="text-sm text-slate-600 mb-1">Prescriptions</div>
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-slate-500 mt-1">
                Active prescriptions
              </div>
            </div>
          </div>

          {/* Upcoming Appointments Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Upcoming Appointments</h2>
            {loading ? (
              <div className="card">
                <p className="text-slate-600 text-sm">
                  Loading appointments...
                </p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="card">
                <p className="text-slate-600 text-sm">
                  No upcoming appointments.{" "}
                  <button
                    onClick={() => navigate("/#book")}
                    className="text-primary underline"
                  >
                    Book one now
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="card p-4 border-l-4 border-primary"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-base">{appt.name}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          📅 {new Date(appt.datetime).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-600">
                          📞 {appt.phone}
                        </p>
                        {appt.symptoms && (
                          <p className="text-sm text-slate-600 mt-1">
                            💬 {appt.symptoms}
                          </p>
                        )}
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Scheduled
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {isDoctor && (
        <div className="card p-6 text-center">
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <h2 className="text-2xl font-bold mb-2">Doctor Portal</h2>
          <p className="text-slate-600 mb-6">
            Access the full doctor console to manage appointments and patient
            records.
          </p>
          <button
            onClick={() => navigate("/doctor-console")}
            className="btn-primary"
          >
            Go to Doctor Console
          </button>
        </div>
      )}

      {!isDoctor && (
        <>
          {/* Medicine Tracker Section */}
          <div className="mt-8">
            <MedicineTracker />
          </div>

          {/* Recent Activity Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="card">
              <p className="text-slate-600 text-sm">
                {appointments.length > 0
                  ? `You have ${appointments.length} upcoming appointment(s).`
                  : "No recent activity to display."}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/#book")}
                className="card hover:shadow-md transition cursor-pointer text-left"
              >
                <div className="font-semibold mb-1">📅 Book Appointment</div>
                <div className="text-sm text-slate-600">
                  Schedule a new appointment
                </div>
              </button>

              <button
                onClick={() => navigate("/diagnostics")}
                className="card hover:shadow-md transition cursor-pointer text-left"
              >
                <div className="font-semibold mb-1">🔬 View Test Results</div>
                <div className="text-sm text-slate-600">
                  Check your diagnostic reports
                </div>
              </button>

              <button
                onClick={() => navigate("/doctors")}
                className="card hover:shadow-md transition cursor-pointer text-left"
              >
                <div className="font-semibold mb-1">👨‍⚕️ Find Doctors</div>
                <div className="text-sm text-slate-600">
                  Browse our specialist doctors
                </div>
              </button>

              <button
                onClick={() => navigate("/resources")}
                className="card hover:shadow-md transition cursor-pointer text-left"
              >
                <div className="font-semibold mb-1">📚 Health Resources</div>
                <div className="text-sm text-slate-600">
                  Access health tips and articles
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
