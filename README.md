# 🏥 Wednesday Healthcare Platform

A full-stack healthcare management system built with **FastAPI**, **React**, **PostgreSQL**, and **Docker**.

## 🌟 Features

### Patient Features

- ✅ **User Authentication** - Secure JWT-based login/signup
- ✅ **AI Symptom Checker** - AI-powered triage system using NLP
- ✅ **Book Appointments** - Schedule appointments with doctors
- ✅ **Dashboard** - View upcoming appointments and medicines
- ✅ **Medicine Tracker** - Track prescribed medicines and compliance
- ✅ **Dark/Light Mode** - Theme toggling with Tailwind CSS

### Doctor Features

- ✅ **Doctor Console** - Manage all patient appointments
- ✅ **Prescription Management** - Prescribe medicines to patients
- ✅ **Patient Compliance Analytics** - Track patient adherence rates
- ✅ **Medicine Adherence Reports** - Monitor how long patients continued medicines

### Public Features

- ✅ **Doctor Listing** - Browse available doctors
- ✅ **Departments** - Browse hospital departments
- ✅ **Diagnostic Services** - View available tests
- ✅ **Resources** - Educational health resources

## 🏗️ Architecture

```
wednesday/
├── backend/              # FastAPI application
│   ├── main.py          # App initialization
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── auth.py          # JWT authentication
│   ├── db.py            # Database configuration
│   ├── seed.py          # Database seeding
│   ├── routers/         # API endpoints
│   │   ├── auth.py      # Auth endpoints
│   │   ├── appointments.py
│   │   ├── medicines.py # Medicine prescription & analytics
│   │   ├── doctors.py
│   │   ├── departments.py
│   │   ├── diagnostics.py
│   │   ├── symptoms.py
│   │   ├── ai.py        # AI triage endpoint
│   │   └── realtime.py
│   └── Dockerfile
│
├── frontend/            # React + TypeScript application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AppointmentBooking.tsx
│   │   │   ├── Doctors.tsx
│   │   │   ├── DoctorConsole.tsx
│   │   │   ├── Symptoms.tsx
│   │   │   ├── SymptomsChecker.tsx
│   │   │   └── ...
│   │   ├── components/  # Reusable components
│   │   │   ├── MedicineTracker.tsx
│   │   │   ├── DoctorPrescription.tsx
│   │   │   ├── AISymptomChecker.tsx
│   │   │   ├── RealtimeAlerts.tsx
│   │   │   └── ...
│   │   ├── lib/         # Utilities
│   │   │   ├── api.ts   # Axios instance
│   │   │   ├── auth.ts  # Auth service
│   │   │   └── theme.ts # Theme management
│   │   └── hooks/       # Custom hooks
│   ├── tailwind.config.cjs
│   ├── vite.config.ts
│   └── Dockerfile
│
├── realtime/           # WebSocket server for notifications
│   ├── server.js
│   ├── package.json
│   └── Dockerfile
│
├── infra/
│   └── compose.yaml    # Docker Compose configuration
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL (handled by Docker)

### Setup with Docker Compose

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/wednesday.git
   cd wednesday
   ```

2. **Start all services**

   ```bash
   docker compose -f infra/compose.yaml up --build
   ```

3. **Seed the database** (in a new terminal)

   ```bash
   docker compose -f infra/compose.yaml exec -T backend python seed.py
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development Setup

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## 📊 Doctor Console Features

### Appointments Tab

- View all upcoming appointments
- See patient details, symptoms, and appointment time
- Quick access to prescribe medicines

### Prescriptions Tab

- List all medicines prescribed
- See patient compliance (days continued)
- Track medicine completion status
- View notes and dosage information

### Analytics Tab

- **Overall Compliance Rate** - Percentage of medicines completed
- **Summary Cards** - Total prescribed, completed, active count
- **Patient-wise Analytics** - Individual compliance per patient
- **Progress Bars** - Color-coded compliance visualization

## 🔐 Authentication

### Default Doctor Credentials

| Doctor          | Email                    | Password  |
| --------------- | ------------------------ | --------- |
| Dr. Aisha Patel | aisha.patel@hospital.com | 123456789 |
| Dr. Miguel Chen | miguel.chen@hospital.com | 123456789 |
| Dr. Sara Khan   | sara.khan@hospital.com   | 123456789 |

## 🛠️ API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Appointments

- `POST /appointments/` - Create appointment
- `GET /appointments/upcoming` - Get patient's upcoming appointments
- `GET /appointments/doctor` - Get doctor's appointments

### Medicines

- `POST /medicines/` - Doctor prescribes medicine
- `GET /medicines/patient` - Get patient's medicines
- `GET /medicines/doctor/patients-medicines` - Get all medicines prescribed by doctor
- `GET /medicines/doctor/analytics` - Get compliance analytics
- `PATCH /medicines/{id}/complete` - Mark medicine as completed

### AI

- `POST /ai/triage` - AI symptom checker/triage

## 📦 Tech Stack

**Backend:**

- FastAPI 0.104+
- SQLAlchemy 2.0+ (async)
- PostgreSQL with asyncpg
- Pydantic for validation
- JWT for authentication
- Passlib for password hashing

**Frontend:**

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

**Infrastructure:**

- Docker & Docker Compose
- PostgreSQL
- Redis
- RabbitMQ
- Node.js WebSocket server

## 📝 Database Models

### Users

- id, name, email, password_hash, phone, role (patient/doctor/admin)

### Doctors

- id, user_id (FK), name, specialty, experience, fee

### Appointments

- id, user_id (FK), doctor_id (FK), datetime, symptoms, status

### Medicines

- id, user_id (FK), doctor_id (FK), appointment_id (FK)
- medicine_name, dosage, frequency, duration_days
- start_date, is_completed, notes, created_at

## 🔄 Data Flow

1. **Patient registers/logs in** → JWT token stored in localStorage
2. **Patient books appointment** → Appointment created in database
3. **Doctor logs in** → Views upcoming appointments in Doctor Console
4. **Doctor prescribes medicine** → Medicine record created with patient_id, doctor_id
5. **Patient marks medicine complete** → is_completed flag updated
6. **Doctor views analytics** → Compliance data aggregated from medicines table

## 🚢 Deployment

### Using Docker (Production)

```bash
docker compose -f infra/compose.yaml up -d
```

### Environment Variables

Create `.env` files in backend and frontend directories:

**backend/.env**

```
DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/wednesday
JWT_SECRET=your-secret-key
ALGORITHM=HS256
```

**frontend/.env**

```
VITE_API_URL=http://localhost:8000
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ for better healthcare management**
