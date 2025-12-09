from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
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
    taken = Column(Integer, default=0)  # 0 = not taken, 1 = taken
    confirmed_at = Column(DateTime, nullable=True)  # When patient confirmed

    medicine = relationship("Medicine", back_populates="daily_doses")

