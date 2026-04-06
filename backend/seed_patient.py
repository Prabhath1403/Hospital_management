import asyncio
import datetime as dt
import random
from sqlalchemy import select
from db import AsyncSessionLocal
from models import User, Doctor, Appointment, HealthMetric, HealthAlert, Medicine, DietLog, FoodItem, LabTestRequest, LabTestResult
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def seed_patient():
    async with AsyncSessionLocal() as session:
        # Check if Prabhath exists
        existing_user = await session.execute(
            select(User).where(User.email == "prabhath@example.com")
        )
        user = existing_user.scalars().first()
        
        if not user:
            print("Creating patient Prabhath...")
            user = User(
                name="Prabhath",
                email="prabhath@example.com",
                password_hash=pwd_context.hash("password"),
                phone="+1234567890",
                role="patient"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
        else:
            print("Patient Prabhath already exists.")

        # Get a doctor to assign the appointment to
        doctor_res = await session.execute(select(Doctor))
        doctor = doctor_res.scalars().first()
        
        if not doctor:
            print("No doctors found! Please ensure default data is seeded.")
            return

        # 1. Add Appointment for today
        print("Adding appointment...")
        appt = Appointment(
            name=user.name,
            phone=user.phone or "1234567890",
            datetime=dt.datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0),
            doctor_id=doctor.id,
            user_id=user.id,
            symptoms="Mild chest pain and frequent headaches in the evening.",
            status="scheduled"
        )
        session.add(appt)

        # 2. Add HealthMetrics
        print("Adding health metrics...")
        base_time = dt.datetime.utcnow() - dt.timedelta(days=10)
        for i in range(10):
            metric = HealthMetric(
                user_id=user.id,
                bp_systolic=random.randint(125, 145),
                bp_diastolic=random.randint(80, 95),
                blood_sugar=random.uniform(90, 115),
                bmi=26.5 + random.uniform(-0.5, 0.5),
                heart_rate=random.randint(75, 90),
                recorded_at=base_time + dt.timedelta(days=i)
            )
            session.add(metric)

        # 3. Add Medications
        print("Adding active medications...")
        med1 = Medicine(
            user_id=user.id,
            doctor_id=doctor.id,
            medicine_name="Lisinopril",
            dosage="10mg",
            frequency="Once Daily",
            duration_days=30,
            start_date=dt.datetime.utcnow() - dt.timedelta(days=15),
            notes="For blood pressure management",
            is_completed=0
        )
        med2 = Medicine(
            user_id=user.id,
            doctor_id=doctor.id,
            medicine_name="Aspirin",
            dosage="81mg",
            frequency="Once Daily",
            duration_days=30,
            start_date=dt.datetime.utcnow() - dt.timedelta(days=15),
            notes="Preventive cardiology",
            is_completed=0
        )
        session.add_all([med1, med2])

        # 4. Add HealthAlerts
        print("Adding health alerts...")
        alert1 = HealthAlert(
            user_id=user.id,
            alert_type="High Blood Pressure",
            severity="Medium",
            message="Sustained elevated systolic BP over 140 mmHg for 3 consecutive days.",
            is_active=1,
            created_at=dt.datetime.utcnow() - dt.timedelta(days=2)
        )
        session.add(alert1)

        # 5. Add DietLogs
        print("Adding diet logs...")
        for i in range(7):
            log_date = dt.date.today() - dt.timedelta(days=i)
            diet_log = DietLog(
                user_id=user.id,
                log_date=log_date,
                created_at=dt.datetime.combine(log_date, dt.time(20, 0))
            )
            session.add(diet_log)
            await session.flush()
            
            food = FoodItem(
                diet_log_id=diet_log.id,
                name="Standard Meals",
                calories=random.randint(2100, 2400),
                protein_g=random.randint(70, 90),
                carbs_g=random.randint(250, 300),
                fat_g=random.randint(60, 80)
            )
            session.add(food)

        # 6. Add a completed Lab Test
        print("Adding a completed lab test...")
        tech_res = await session.execute(select(User).where(User.role == "lab_technician"))
        tech = tech_res.scalars().first()
        
        lab_req = LabTestRequest(
            patient_id=user.id,
            doctor_id=doctor.id,
            test_name="Lipid Profile & HbA1c",
            reason="Routine checkup due to high BP and BMI",
            status="completed",
            requested_at=dt.datetime.utcnow() - dt.timedelta(days=1)
        )
        session.add(lab_req)
        await session.flush()
        
        lab_res = LabTestResult(
            request_id=lab_req.id,
            technician_id=tech.id if tech else user.id,
            result_data='{"Total Cholesterol": "210 mg/dL (High)", "LDL": "150 mg/dL (High)", "HDL": "45 mg/dL (Normal)", "Triglycerides": "180 mg/dL (High)", "HbA1c": "5.6% (Normal)"}',
            uploaded_at=dt.datetime.utcnow() - dt.timedelta(hours=10)
        )
        session.add(lab_res)

        await session.commit()
        print("✅ Fake data seeded successfully for Prabhath!")

if __name__ == "__main__":
    asyncio.run(seed_patient())
