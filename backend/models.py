from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from db import Base
import datetime as dt
from passlib.context import CryptContext

# Use pbkdf2_sha256 to avoid bcrypt's 72-byte password limit and binary
# dependency issues inside containers. pbkdf2_sha256 is supported by
# passlib and works well for general use-cases.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(String, default="patient")  # patient, doctor, admin
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    def verify_password(self, password: str) -> bool:
        return pwd_context.verify(password, self.password_hash)

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)


class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialty = Column(String, nullable=False)
    experience = Column(String, nullable=True)
    fee = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", foreign_keys=[user_id])


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    datetime = Column(DateTime, nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    symptoms = Column(Text)
    payment = Column(String)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled
    diagnosis = Column(Text, nullable=True)  # What the patient is suffering from
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    doctor = relationship("Doctor")
    user = relationship("User")
    department = relationship("Department")


class Medicine(Base):
    __tablename__ = "medicines"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)  # e.g., "500mg"
    frequency = Column(String, nullable=False)  # e.g., "2 times daily"
    duration_days = Column(Integer, nullable=False)  # number of days
    times_of_day = Column(String, nullable=True)  # Comma separated e.g., "Morning,Night"
    start_date = Column(DateTime, default=dt.datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    is_completed = Column(Integer, default=0)  # 0 = ongoing, 1 = completed
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    user = relationship("User")
    doctor = relationship("Doctor")
    appointment = relationship("Appointment")
    daily_doses = relationship("DailyDose", back_populates="medicine")


class DailyDose(Base):
    __tablename__ = "daily_doses"
    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    dose_date = Column(DateTime, nullable=False)  # The date of the dose
    time_of_day = Column(String, nullable=True)  # e.g., "Morning", "Afternoon", "Night"
    taken = Column(Integer, default=0)  # 0 = not taken, 1 = taken
    confirmed_at = Column(DateTime, nullable=True)  # When patient confirmed

    medicine = relationship("Medicine", back_populates="daily_doses")


class HealthMetric(Base):
    __tablename__ = "health_metrics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bp_systolic = Column(Integer, nullable=True)
    bp_diastolic = Column(Integer, nullable=True)
    blood_sugar = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    user = relationship("User")


class HealthAlert(Base):
    __tablename__ = "health_alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)  # Low, Medium, High, Critical
    message = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = resolved
    created_at = Column(DateTime, default=dt.datetime.utcnow, nullable=False)

    user = relationship("User")


class DietLog(Base):
    __tablename__ = "diet_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    log_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=dt.datetime.utcnow)

    user = relationship("User")
    food_items = relationship("FoodItem", back_populates="diet_log")

class LabTestRequest(Base):
    __tablename__ = "lab_test_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))
    test_name = Column(String)
    reason = Column(String)
    status = Column(String, default="pending")  # pending, completed
    requested_at = Column(DateTime, default=dt.datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    result = relationship("LabTestResult", back_populates="request", uselist=False)

class LabTestResult(Base):
    __tablename__ = "lab_test_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("lab_test_requests.id"))
    technician_id = Column(Integer, ForeignKey("users.id"))
    result_data = Column(Text)  # Stores the findings/text/json from the test
    uploaded_at = Column(DateTime, default=dt.datetime.utcnow)

    # Relationships
    request = relationship("LabTestRequest", back_populates="result")
    technician = relationship("User", foreign_keys=[technician_id])


class FoodItem(Base):
    __tablename__ = "food_items"
    id = Column(Integer, primary_key=True, index=True)
    diet_log_id = Column(Integer, ForeignKey("diet_logs.id"), nullable=False)
    name = Column(String, nullable=False)
    calories = Column(Float, default=0)
    protein_g = Column(Float, default=0)
    carbs_g = Column(Float, default=0)
    fat_g = Column(Float, default=0)
    quantity = Column(Float, default=1)

    diet_log = relationship("DietLog", back_populates="food_items")
