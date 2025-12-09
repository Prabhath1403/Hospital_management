import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppointmentForm from "../components/AppointmentForm";
import AISymptomChecker from "../components/AISymptomChecker";
import EmergencyBanner from "../components/EmergencyBanner";
import RealtimeAlerts from "../components/RealtimeAlerts";
import { authService } from "../lib/auth";

const doctors = [
  { id: "d1", name: "Dr. Aisha Patel — Cardiology" },
  { id: "d2", name: "Dr. Miguel Chen — General Medicine" },
  { id: "d3", name: "Dr. Sara Khan — Diagnostics" },
];

const departments = [
  { id: "cardio", name: "Cardiology" },
  { id: "gm", name: "General Medicine" },
  { id: "icu", name: "Emergency & ICU" },
  { id: "diag", name: "Diagnostics" },
];

const services = [
  { title: "Cardiology", desc: "ECG, Echo, Cath Lab, 24/7 cardiac ICU." },
  { title: "Diagnostics", desc: "Blood tests, X-Ray, CT, MRI, Ultrasound." },
  { title: "Emergency", desc: "Level-1 trauma, rapid triage, ambulance." },
  {
    title: "General Medicine",
    desc: "Primary care and chronic disease support.",
  },
];

export default function Home() {
  const location = useLocation();
  const user = authService.getUser();
  const isDoctor = user?.role === "doctor";

  useEffect(() => {
    if (location.hash === "#book") {
      setTimeout(() => {
        const bookSection = document.getElementById("book");
        if (bookSection) {
          bookSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen">
      <EmergencyBanner />
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-4">
              Advanced Healthcare Platform
            </div>
            <h1 className="text-5xl font-black mb-6 text-white leading-tight">
              Your Health,
              <br />
              <span className="text-gradient">Our Priority</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Book appointments with specialists, check symptoms with AI-powered
              analysis, and get real-time updates on queues and emergency wait
              times.
            </p>
            {!isDoctor && (
              <div className="flex gap-4 flex-wrap">
                <a href="#book" className="btn-primary">
                  📅 Book Now
                </a>
                <a href="#ai" className="btn-secondary">
                  🤖 AI Checker
                </a>
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="card animate-glow p-8 text-center">
              <div className="text-6xl mb-4">🏥</div>
              <h3 className="text-2xl font-bold text-cyan-400 mb-2">
                24/7 Service
              </h3>
              <p className="text-slate-400">
                Always available for your healthcare needs
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center mb-12">Our Departments</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((svc, i) => (
              <div
                key={i}
                className="card group hover:animate-glow p-6 text-center"
              >
                <div className="text-4xl mb-3">
                  {i === 0 ? "❤️" : i === 1 ? "🔬" : i === 2 ? "🚑" : "💊"}
                </div>
                <h3 className="text-cyan-400 font-bold mb-2">{svc.title}</h3>
                <p className="text-sm text-slate-400">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {!isDoctor && (
        <>
          <section
            id="book"
            className="py-16 px-4 bg-gradient-to-b from-transparent to-cyan-950/20"
          >
            <div className="max-w-2xl mx-auto">
              <h2 className="section-title text-center mb-12">
                Book Your Appointment
              </h2>
              <AppointmentForm doctors={doctors} departments={departments} />
            </div>
          </section>
          <section id="ai" className="py-16 px-4">
            <div className="max-w-2xl mx-auto">
              <h2 className="section-title text-center mb-12">
                AI Symptom Checker
              </h2>
              <AISymptomChecker />
            </div>
          </section>
        </>
      )}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-cyan-950/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-center mb-12">Live Updates</h2>
          <RealtimeAlerts />
        </div>
      </section>
    </div>
  );
}
