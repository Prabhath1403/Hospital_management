"""
Seeds 4 realistic patients with full clinical histories.
Each patient has: demographics, vitals, medications, lab results, alerts, diet, and appointments.
Safe to run multiple times — skips patients that already exist.
"""
import asyncio
import datetime as dt
import random
import json
from sqlalchemy import select
from db import AsyncSessionLocal
from models import (
    User, Doctor, Appointment, HealthMetric, HealthAlert,
    Medicine, DietLog, FoodItem, LabTestRequest, LabTestResult
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

PATIENTS = [
    {
        "name": "Ananya Sharma",
        "email": "ananya@patient.com",
        "phone": "+91-9876543210",
        "date_of_birth": dt.date(1975, 3, 15),
        "gender": "Female",
        "blood_group": "B+",
        "disease": "Breast Cancer (Stage II)",
        "symptoms": "Persistent lump in right breast, unexplained weight loss of 5kg over 2 months, fatigue and night sweats.",
        "vitals_profile": {
            "bp_sys": (118, 135), "bp_dia": (72, 88), "sugar": (95, 130),
            "bmi": 23.5, "hr": (68, 82)
        },
        "medications": [
            {"name": "Tamoxifen", "dosage": "20mg", "freq": "Once Daily", "days": 60, "times": "Morning", "notes": "Hormone receptor-positive breast cancer treatment"},
            {"name": "Ondansetron", "dosage": "8mg", "freq": "Twice Daily", "days": 14, "times": "Morning,Night", "notes": "Anti-nausea for chemotherapy side effects"},
            {"name": "Filgrastim", "dosage": "300mcg", "freq": "Once Daily", "days": 10, "times": "Morning", "notes": "White blood cell boost post-chemo"},
        ],
        "completed_meds": [
            {"name": "Doxorubicin", "dosage": "60mg/m²", "freq": "Cycle", "days": 21, "notes": "Completed chemo cycle 1"},
        ],
        "alerts": [
            {"type": "Low WBC Count", "severity": "Critical", "message": "Neutrophil count dropped to 1.2 x10^9/L after chemotherapy cycle. Monitor for infections."},
            {"type": "Weight Loss", "severity": "Warning", "message": "Patient lost 5kg in 8 weeks. Nutritional assessment recommended."},
        ],
        "lab_tests": [
            {"test": "Complete Blood Count (CBC)", "reason": "Post-chemotherapy monitoring",
             "result": json.dumps({"WBC": "3.2 x10^9/L (Low)", "RBC": "3.8 x10^12/L (Low-Normal)", "Hemoglobin": "10.5 g/dL (Low)", "Platelets": "145 x10^9/L (Normal)", "Neutrophils": "1.2 x10^9/L (Critical Low)"})},
            {"test": "Tumor Marker CA 15-3", "reason": "Breast cancer monitoring",
             "result": json.dumps({"CA 15-3": "42 U/mL (Elevated)", "CEA": "5.8 ng/mL (Borderline High)", "Status": "Requires follow-up imaging"})},
        ],
        "diet_cal": (1600, 1900), "diet_protein": (55, 70), "diet_carbs": (180, 220), "diet_fat": (50, 65),
        "past_visits": [
            {"symptoms": "Initial breast lump detected during self-examination. Pain in axillary region.", "days_ago": 45},
            {"symptoms": "Follow-up after biopsy confirmation of Stage II invasive ductal carcinoma.", "days_ago": 30},
        ],
    },
    {
        "name": "Rahul Verma",
        "email": "rahul@patient.com",
        "phone": "+91-9123456789",
        "date_of_birth": dt.date(1998, 8, 22),
        "gender": "Male",
        "blood_group": "O+",
        "disease": "Acute Appendicitis",
        "symptoms": "Severe pain in right lower abdomen (McBurney's point), nausea, vomiting, low-grade fever of 100.4°F for 2 days.",
        "vitals_profile": {
            "bp_sys": (122, 138), "bp_dia": (78, 88), "sugar": (85, 105),
            "bmi": 24.2, "hr": (88, 105)
        },
        "medications": [
            {"name": "Ceftriaxone", "dosage": "1g IV", "freq": "Twice Daily", "days": 7, "times": "Morning,Night", "notes": "Pre/post-operative antibiotic for appendicitis"},
            {"name": "Metronidazole", "dosage": "500mg", "freq": "Thrice Daily", "days": 7, "times": "Morning,Afternoon,Night", "notes": "Anaerobic bacterial coverage post-appendectomy"},
            {"name": "Tramadol", "dosage": "50mg", "freq": "Twice Daily", "days": 5, "times": "Morning,Night", "notes": "Post-surgical pain management"},
        ],
        "completed_meds": [],
        "alerts": [
            {"type": "Post-Surgical Fever", "severity": "Warning", "message": "Temperature spiked to 101.2°F on post-op day 2. Blood cultures drawn."},
            {"type": "Elevated WBC", "severity": "High", "message": "WBC count 15,800/μL indicating active infection or post-surgical inflammatory response."},
        ],
        "lab_tests": [
            {"test": "Complete Blood Count (CBC)", "reason": "Acute abdominal pain evaluation",
             "result": json.dumps({"WBC": "15.8 x10^9/L (High)", "RBC": "5.1 x10^12/L (Normal)", "Hemoglobin": "14.2 g/dL (Normal)", "Platelets": "280 x10^9/L (Normal)", "Neutrophils": "82% (High - Left Shift)"})},
            {"test": "CT Abdomen with Contrast", "reason": "Confirm appendicitis diagnosis",
             "result": json.dumps({"Findings": "Enlarged appendix (12mm diameter) with periappendiceal fat stranding", "Appendicolith": "Present", "Perforation": "No evidence", "Diagnosis": "Acute uncomplicated appendicitis"})},
            {"test": "CRP (C-Reactive Protein)", "reason": "Infection marker",
             "result": json.dumps({"CRP": "85 mg/L (Significantly Elevated)", "Normal Range": "<10 mg/L", "Interpretation": "Consistent with acute inflammatory process"})},
        ],
        "diet_cal": (1800, 2200), "diet_protein": (75, 95), "diet_carbs": (220, 280), "diet_fat": (55, 75),
        "past_visits": [
            {"symptoms": "Acute onset RLQ pain, rebound tenderness positive, Rovsing sign positive.", "days_ago": 5},
        ],
    },
    {
        "name": "Meera Krishnan",
        "email": "meera@patient.com",
        "phone": "+91-9988776655",
        "date_of_birth": dt.date(1965, 11, 3),
        "gender": "Female",
        "blood_group": "A-",
        "disease": "Type 2 Diabetes with Diabetic Nephropathy",
        "symptoms": "Persistent polyuria, increased thirst, blurred vision, tingling in feet, and recent ankle swelling.",
        "vitals_profile": {
            "bp_sys": (140, 165), "bp_dia": (88, 100), "sugar": (180, 320),
            "bmi": 31.2, "hr": (72, 88)
        },
        "medications": [
            {"name": "Metformin", "dosage": "1000mg", "freq": "Twice Daily", "days": 90, "times": "Morning,Night", "notes": "First-line diabetes management"},
            {"name": "Glimepiride", "dosage": "2mg", "freq": "Once Daily", "days": 90, "times": "Morning", "notes": "Sulfonylurea for glycemic control"},
            {"name": "Losartan", "dosage": "50mg", "freq": "Once Daily", "days": 90, "times": "Night", "notes": "Nephroprotective ARB for diabetic kidney disease"},
            {"name": "Atorvastatin", "dosage": "20mg", "freq": "Once Daily", "days": 90, "times": "Night", "notes": "Cholesterol control — high cardiovascular risk"},
        ],
        "completed_meds": [
            {"name": "Amoxicillin", "dosage": "500mg", "freq": "Thrice Daily", "days": 7, "notes": "Urinary tract infection treatment"},
        ],
        "alerts": [
            {"type": "Uncontrolled Blood Sugar", "severity": "Critical", "message": "Fasting blood glucose consistently above 250 mg/dL for 5 days. HbA1c at 9.2%. Insulin therapy may be needed."},
            {"type": "Kidney Function Declining", "severity": "Critical", "message": "eGFR dropped from 58 to 45 mL/min/1.73m². Stage 3b CKD. Nephrology referral urgent."},
            {"type": "Hypertension", "severity": "High", "message": "Average BP readings 155/95 mmHg over last 7 days despite Losartan. Dose adjustment required."},
        ],
        "lab_tests": [
            {"test": "HbA1c & Fasting Glucose", "reason": "Quarterly diabetes monitoring",
             "result": json.dumps({"HbA1c": "9.2% (Poor Control)", "Fasting Glucose": "268 mg/dL (Very High)", "Post-Prandial Glucose": "345 mg/dL (Dangerously High)", "Target HbA1c": "<7.0%"})},
            {"test": "Renal Function Panel", "reason": "Diabetic nephropathy monitoring",
             "result": json.dumps({"Creatinine": "1.8 mg/dL (Elevated)", "BUN": "32 mg/dL (Elevated)", "eGFR": "45 mL/min/1.73m² (Stage 3b CKD)", "Urine Albumin-Creatinine Ratio": "350 mg/g (Severely Elevated)", "Potassium": "5.1 mEq/L (Borderline High)"})},
            {"test": "Lipid Panel", "reason": "Cardiovascular risk assessment",
             "result": json.dumps({"Total Cholesterol": "245 mg/dL (High)", "LDL": "165 mg/dL (High)", "HDL": "38 mg/dL (Low)", "Triglycerides": "280 mg/dL (Very High)", "VLDL": "56 mg/dL (High)"})},
        ],
        "diet_cal": (2200, 2600), "diet_protein": (60, 80), "diet_carbs": (300, 380), "diet_fat": (75, 95),
        "past_visits": [
            {"symptoms": "Routine diabetes follow-up. Complaining of increased fatigue and nocturia.", "days_ago": 60},
            {"symptoms": "Sudden vision blurriness and numbness in toes. Referred to ophthalmology.", "days_ago": 30},
            {"symptoms": "Ankle edema and foamy urine noticed for 2 weeks. Urgent nephrology consult.", "days_ago": 10},
        ],
    },
    {
        "name": "Arjun Reddy",
        "email": "arjun@patient.com",
        "phone": "+91-9871234567",
        "date_of_birth": dt.date(2005, 6, 10),
        "gender": "Male",
        "blood_group": "AB+",
        "disease": "Severe Persistent Asthma",
        "symptoms": "Frequent wheezing episodes (4-5 per week), nocturnal cough, exercise intolerance, chest tightness during cold weather.",
        "vitals_profile": {
            "bp_sys": (110, 122), "bp_dia": (68, 78), "sugar": (80, 100),
            "bmi": 20.8, "hr": (78, 100)
        },
        "medications": [
            {"name": "Fluticasone/Salmeterol", "dosage": "250/50mcg", "freq": "Twice Daily", "days": 90, "times": "Morning,Night", "notes": "ICS/LABA combination inhaler for persistent asthma"},
            {"name": "Montelukast", "dosage": "10mg", "freq": "Once Daily", "days": 90, "times": "Night", "notes": "Leukotriene receptor antagonist for asthma control"},
            {"name": "Salbutamol Inhaler", "dosage": "100mcg", "freq": "As Needed", "days": 30, "times": "Morning", "notes": "Rescue inhaler for acute bronchospasm - max 4-6 puffs/day"},
        ],
        "completed_meds": [
            {"name": "Prednisolone", "dosage": "40mg", "freq": "Once Daily", "days": 5, "notes": "Short course oral steroid for acute asthma exacerbation"},
            {"name": "Azithromycin", "dosage": "500mg", "freq": "Once Daily", "days": 3, "notes": "Respiratory tract infection triggering asthma flare"},
        ],
        "alerts": [
            {"type": "ER Visit - Asthma Attack", "severity": "Critical", "message": "Patient presented to ER with SpO2 of 89%, severe bronchospasm. Required nebulization and IV steroids."},
            {"type": "Peak Flow Declining", "severity": "Warning", "message": "Peak expiratory flow rate dropped from 85% to 62% of predicted over 2 weeks."},
        ],
        "lab_tests": [
            {"test": "Pulmonary Function Test (PFT)", "reason": "Asthma severity assessment",
             "result": json.dumps({"FEV1": "68% predicted (Moderate Obstruction)", "FVC": "82% predicted", "FEV1/FVC Ratio": "0.65 (Obstructive Pattern)", "Bronchodilator Response": "+18% improvement (Reversible)", "Peak Flow": "62% predicted"})},
            {"test": "IgE & Allergy Panel", "reason": "Allergic asthma workup",
             "result": json.dumps({"Total IgE": "450 IU/mL (Elevated)", "Dust Mite": "Positive (Class 4)", "Pollen": "Positive (Class 3)", "Pet Dander": "Positive (Class 2)", "Mold": "Negative", "Eosinophils": "8% (Elevated)"})},
        ],
        "diet_cal": (2400, 2800), "diet_protein": (80, 100), "diet_carbs": (280, 340), "diet_fat": (65, 85),
        "past_visits": [
            {"symptoms": "ER admission — acute asthma attack triggered by cold air exposure during cricket practice.", "days_ago": 20},
            {"symptoms": "Follow-up after ER visit. Still using rescue inhaler 4x/day. Step-up therapy initiated.", "days_ago": 12},
        ],
    },
]


async def seed_patients():
    async with AsyncSessionLocal() as session:
        # Get a doctor
        doc_res = await session.execute(select(Doctor))
        doctor = doc_res.scalars().first()
        if not doctor:
            print("❌ No doctors found! Run seed.py first.")
            return

        # Get lab tech
        tech_res = await session.execute(select(User).where(User.role == "lab_technician"))
        tech = tech_res.scalars().first()

        password_hash = pwd_context.hash("password123")

        for p in PATIENTS:
            # Check if patient already exists
            existing = await session.execute(select(User).where(User.email == p["email"]))
            user = existing.scalars().first()

            if user:
                print(f"⏭️  {p['name']} already exists, skipping.")
                continue

            print(f"\n🏥 Creating patient: {p['name']} ({p['disease']})...")

            # 1. Create User
            user = User(
                name=p["name"],
                email=p["email"],
                password_hash=password_hash,
                phone=p["phone"],
                role="patient",
                date_of_birth=p["date_of_birth"],
                gender=p["gender"],
                blood_group=p["blood_group"],
            )
            session.add(user)
            await session.flush()
            print(f"   ✅ User created (ID: {user.id})")

            # 2. Current Appointment
            appt = Appointment(
                name=user.name,
                phone=user.phone,
                datetime=dt.datetime.utcnow().replace(hour=10, minute=0) + dt.timedelta(days=random.randint(1, 5)),
                doctor_id=doctor.id,
                user_id=user.id,
                symptoms=p["symptoms"],
                status="scheduled"
            )
            session.add(appt)

            # 3. Past Completed Visits
            for visit in p.get("past_visits", []):
                past_appt = Appointment(
                    name=user.name,
                    phone=user.phone,
                    datetime=dt.datetime.utcnow() - dt.timedelta(days=visit["days_ago"]),
                    doctor_id=doctor.id,
                    user_id=user.id,
                    symptoms=visit["symptoms"],
                    status="completed",
                    completed_at=dt.datetime.utcnow() - dt.timedelta(days=visit["days_ago"] - 1),
                )
                session.add(past_appt)
            print(f"   ✅ {1 + len(p.get('past_visits', []))} appointments created")

            # 4. Vitals (10 days of readings)
            vp = p["vitals_profile"]
            base_time = dt.datetime.utcnow() - dt.timedelta(days=10)
            for i in range(10):
                metric = HealthMetric(
                    user_id=user.id,
                    bp_systolic=random.randint(*vp["bp_sys"]),
                    bp_diastolic=random.randint(*vp["bp_dia"]),
                    blood_sugar=round(random.uniform(*vp["sugar"]), 1),
                    bmi=round(vp["bmi"] + random.uniform(-0.3, 0.3), 1),
                    heart_rate=random.randint(*vp["hr"]),
                    recorded_at=base_time + dt.timedelta(days=i),
                )
                session.add(metric)
            print(f"   ✅ 10 vitals readings added")

            # 5. Active Medications
            for med_info in p["medications"]:
                med = Medicine(
                    user_id=user.id,
                    doctor_id=doctor.id,
                    medicine_name=med_info["name"],
                    dosage=med_info["dosage"],
                    frequency=med_info["freq"],
                    duration_days=med_info["days"],
                    times_of_day=med_info.get("times"),
                    start_date=dt.datetime.utcnow() - dt.timedelta(days=random.randint(3, 15)),
                    notes=med_info["notes"],
                    is_completed=0,
                )
                session.add(med)

            # 6. Completed Medications
            for med_info in p.get("completed_meds", []):
                med = Medicine(
                    user_id=user.id,
                    doctor_id=doctor.id,
                    medicine_name=med_info["name"],
                    dosage=med_info["dosage"],
                    frequency=med_info["freq"],
                    duration_days=med_info["days"],
                    start_date=dt.datetime.utcnow() - dt.timedelta(days=med_info["days"] + 10),
                    notes=med_info["notes"],
                    is_completed=1,
                )
                session.add(med)
            print(f"   ✅ {len(p['medications'])} active + {len(p.get('completed_meds', []))} completed medications")

            # 7. Health Alerts
            for alert_info in p["alerts"]:
                alert = HealthAlert(
                    user_id=user.id,
                    alert_type=alert_info["type"],
                    severity=alert_info["severity"],
                    message=alert_info["message"],
                    is_active=1,
                    created_at=dt.datetime.utcnow() - dt.timedelta(days=random.randint(1, 7)),
                )
                session.add(alert)
            print(f"   ✅ {len(p['alerts'])} health alerts added")

            # 8. Lab Tests
            for lab in p["lab_tests"]:
                lab_req = LabTestRequest(
                    patient_id=user.id,
                    doctor_id=doctor.user_id,
                    test_name=lab["test"],
                    reason=lab["reason"],
                    status="completed",
                    requested_at=dt.datetime.utcnow() - dt.timedelta(days=random.randint(2, 10)),
                )
                session.add(lab_req)
                await session.flush()

                lab_result = LabTestResult(
                    request_id=lab_req.id,
                    technician_id=tech.id if tech else user.id,
                    result_data=lab["result"],
                    uploaded_at=dt.datetime.utcnow() - dt.timedelta(hours=random.randint(6, 48)),
                )
                session.add(lab_result)
            print(f"   ✅ {len(p['lab_tests'])} lab tests with results")

            # 9. Diet Logs (7 days)
            for i in range(7):
                log_date = dt.date.today() - dt.timedelta(days=i)
                diet_log = DietLog(
                    user_id=user.id,
                    log_date=log_date,
                    created_at=dt.datetime.combine(log_date, dt.time(20, 0)),
                )
                session.add(diet_log)
                await session.flush()

                food = FoodItem(
                    diet_log_id=diet_log.id,
                    name="Daily Meals",
                    calories=random.randint(*p["diet_cal"]),
                    protein_g=random.randint(*p["diet_protein"]),
                    carbs_g=random.randint(*p["diet_carbs"]),
                    fat_g=random.randint(*p["diet_fat"]),
                )
                session.add(food)
            print(f"   ✅ 7 days of diet logs")

        await session.commit()
        print("\n🎉 All patients seeded successfully!")
        print("\n📋 Login credentials for all patients:")
        print("   Password: password123")
        for p in PATIENTS:
            print(f"   • {p['name']:20s} → {p['email']}")


if __name__ == "__main__":
    asyncio.run(seed_patients())
