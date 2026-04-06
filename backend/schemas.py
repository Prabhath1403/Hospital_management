from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class DoctorOut(BaseModel):
    id: int
    name: str
    specialty: str
    experience: Optional[str]
    fee: Optional[str]

    class Config:
        from_attributes = True


class DepartmentOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class AppointmentCreate(BaseModel):
    name: str
    phone: str
    datetime: datetime
    doctorId: Optional[int] = Field(default=None, alias="doctorId")
    departmentId: Optional[int] = Field(default=None, alias="departmentId")
    symptoms: Optional[str] = None
    payment: Optional[str] = None

    class Config:
        populate_by_name = True


class AppointmentOut(BaseModel):
    id: int
    name: str
    phone: str
    datetime: datetime
    doctor_id: Optional[int] = None
    department_id: Optional[int] = None
    user_id: Optional[int] = None
    symptoms: Optional[str] = None
    payment: Optional[str] = None
    status: str = "scheduled"
    diagnosis: Optional[str] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TriageRequest(BaseModel):
    symptoms: str


class DoctorProfile(BaseModel):
    name: str
    specialization: str
    experience: str
    hospital: str
    image: str
    description: str


class TriageResponse(BaseModel):
    summary: str
    possibleSystems: list[str]
    specialistSuggestion: str
    recommendedTests: list[str]
    doctorProfiles: list[DoctorProfile]
    safetyNote: str
    reportAnalysis: str | None = None


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    role: str = "patient"
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "password": "securepassword123",
                "phone": "+1234567890",
                "role": "patient"
            }
        }


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class MedicineCreate(BaseModel):
    medicine_name: str
    dosage: str  # e.g., "500mg"
    frequency: str  # e.g., "2 times daily"
    duration_days: int
    user_id: int  # patient ID
    times_of_day: Optional[str] = None
    appointment_id: Optional[int] = None
    notes: Optional[str] = None


class MedicineOut(BaseModel):
    id: int
    user_id: int
    doctor_id: Optional[int]
    appointment_id: Optional[int]
    medicine_name: str
    dosage: str
    frequency: str
    duration_days: int
    times_of_day: Optional[str] = None
    start_date: datetime
    notes: Optional[str]
    is_completed: int
    created_at: datetime

    class Config:
        from_attributes = True


class DailyDoseCreate(BaseModel):
    dose_date: datetime


class DailyDoseOut(BaseModel):
    id: int
    medicine_id: int
    dose_date: datetime
    time_of_day: Optional[str]
    taken: int
    confirmed_at: Optional[datetime]

    class Config:
        from_attributes = True

