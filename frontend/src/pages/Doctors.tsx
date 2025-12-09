import { useNavigate } from "react-router-dom";

const doctors = [
  {
    id: 1,
    name: "Dr. Aisha Patel",
    specialty: "Cardiology",
    experience: "12 yrs",
    fee: "$60",
    icon: "❤️",
  },
  {
    id: 2,
    name: "Dr. Miguel Chen",
    specialty: "General Medicine",
    experience: "10 yrs",
    fee: "$40",
    icon: "⚕️",
  },
  {
    id: 3,
    name: "Dr. Sara Khan",
    specialty: "Radiology",
    experience: "8 yrs",
    fee: "$55",
    icon: "🔬",
  },
];

export default function Doctors() {
  const navigate = useNavigate();

  const handleBookAppointment = (doctorId: number) => {
    navigate(`/book-appointment?doctorId=${doctorId}`);
  };
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="section-title text-4xl text-center">
            Meet Our Specialists
          </h1>
          <p className="text-center text-slate-400 mt-4 max-w-2xl mx-auto">
            Experienced doctors ready to provide you with the best healthcare
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {doctors.map((d) => (
            <div
              key={d.name}
              className="card p-6 space-y-4 group hover:scale-105 transform transition duration-300"
            >
              <div className="text-6xl text-center mb-4">{d.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{d.name}</h3>
                <p className="text-cyan-400 font-semibold text-sm">
                  {d.specialty}
                </p>
              </div>

              <div className="space-y-2 py-3 border-t border-cyan-500/20 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Experience:</span>
                  <span className="text-cyan-300 font-medium">
                    {d.experience}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Consultation Fee:</span>
                  <span className="text-cyan-300 font-bold">{d.fee}</span>
                </div>
              </div>

              <button
                onClick={() => handleBookAppointment(d.id)}
                className="btn-primary w-full mt-4"
              >
                📅 Book Appointment
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
