import { useState, useEffect } from "react";
import {
  Route,
  Routes,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Departments from "./pages/Departments";
import Diagnostics from "./pages/Diagnostics";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import Symptoms from "./pages/Symptoms";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AppointmentBooking from "./pages/AppointmentBooking";
import SymptomsChecker from "./pages/SymptomsChecker";
import DoctorConsole from "./pages/DoctorConsole";
import { authService } from "./lib/auth";
import { getTheme, setTheme, toggleTheme } from "./lib/theme";

function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();
  const [theme, setThemeState] = useState<"light" | "dark">(getTheme());

  useEffect(() => {
    // Listen for theme changes
    const handleThemeChange = (e: any) => {
      setThemeState(e.detail.theme);
    };

    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
  };

  const handleBookAppointment = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/book-appointment");
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const handleHomepage = () => {
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
        >
          🏥 HealthCare
        </Link>
        <nav className="hidden md:flex gap-1 items-center">
          <Link
            to="/"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition"
          >
            Home
          </Link>
          <Link
            to="/doctors"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition"
          >
            Doctors
          </Link>
          <Link
            to="/departments"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition"
          >
            Departments
          </Link>
          <Link
            to="/symptoms"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition"
          >
            Symptoms
          </Link>
          <Link
            to="/diagnostics"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition"
          >
            Tests
          </Link>
          <Link
            to="/resources"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition"
          >
            Resources
          </Link>
        </nav>

        <div className="flex gap-2 items-center">
          <button
            onClick={handleThemeToggle}
            className="px-3 py-2 rounded-md text-lg hover:bg-slate-800/50 transition"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:inline-block px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-cyan-400 transition"
              >
                Dashboard
              </Link>
              {user?.role === "doctor" && (
                <Link
                  to="/doctor-console"
                  className="hidden sm:inline-block px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition font-bold"
                >
                  📊 Doctor Console
                </Link>
              )}
              <span className="text-xs text-slate-400 hidden sm:inline">
                Hi, {user?.name}
              </span>
              {user?.role !== "doctor" && (
                <button
                  onClick={handleBookAppointment}
                  className="btn-primary text-xs"
                >
                  📅 Book
                </button>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
              >
                Login
              </Link>
              <Link to="/signup" className="btn-primary text-xs">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = authService.isAuthenticated();
  const location = useLocation();
  return isAuthenticated ? (
    children
  ) : (
    <Navigate
      to={`/login?redirect=${encodeURIComponent(
        location.pathname + location.search
      )}`}
      replace
    />
  );
}

function PatientRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  // Redirect doctors away from patient routes
  if (user?.role === "doctor") {
    return <Navigate to="/doctor-console" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: React.ReactElement }) {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6">
        <div>
          <div className="text-lg font-semibold">CareNow Hospital</div>
          <p className="text-sm text-slate-400 mt-2">
            Your health, our priority. 24/7 emergency care.
          </p>
        </div>
        <div>
          <div className="font-semibold">Quick Links</div>
          <ul className="text-sm text-slate-400 space-y-1 mt-2">
            <li>Services</li>
            <li>Doctors</li>
            <li>Diagnostics</li>
            <li>Insurance & Payments</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Contact</div>
          <div className="text-sm text-slate-400 mt-2">
            <p>123 Health Ave, City</p>
            <p>+1 (555) 010-0000</p>
            <p>care@carenow.health</p>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 pb-4">
        © {new Date().getFullYear()} CareNow. All rights reserved.
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PatientRoute>
                <Dashboard />
              </PatientRoute>
            }
          />
          <Route
            path="/book-appointment"
            element={
              <PatientRoute>
                <AppointmentBooking />
              </PatientRoute>
            }
          />
          <Route
            path="/doctor-console"
            element={
              <ProtectedRoute>
                <DoctorConsole />
              </ProtectedRoute>
            }
          />
          <Route path="/ai-symptoms" element={<SymptomsChecker />} />
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/diagnostics" element={<Diagnostics />} />
          <Route path="/symptoms" element={<Symptoms />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
