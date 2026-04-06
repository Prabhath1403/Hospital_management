"""
Admin Router
Handles creation of system staff (Doctors, Lab Technicians)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
import datetime as dt
from pydantic import BaseModel
from passlib.context import CryptContext

from db import get_session
from models import User, Doctor, Appointment, LabTestRequest
from queries.patient_analytics import fetch_patient_history

router = APIRouter()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class CreateDoctorReq(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    specialty: str
    experience: str
    fee: str

class CreateLabTechReq(BaseModel):
    name: str
    email: str
    password: str
    phone: str

@router.post("/doctors")
async def create_doctor(req: CreateDoctorReq, db: AsyncSession = Depends(get_session)):
    # Check email exists
    ext = await db.execute(select(User).where(User.email == req.email))
    if ext.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=pwd_context.hash(req.password),
        phone=req.phone,
        role="doctor"
    )
    db.add(user)
    await db.flush()

    doc = Doctor(
        name=req.name,
        user_id=user.id,
        specialty=req.specialty,
        experience=req.experience,
        fee=req.fee
    )
    db.add(doc)
    await db.commit()
    return {"status": "success", "user_id": user.id}


@router.post("/labs")
async def create_lab_technician(req: CreateLabTechReq, db: AsyncSession = Depends(get_session)):
    ext = await db.execute(select(User).where(User.email == req.email))
    if ext.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=req.name,
        email=req.email,
        password_hash=pwd_context.hash(req.password),
        phone=req.phone,
        role="lab_technician"
    )
    db.add(user)
    await db.commit()
    return {"status": "success", "user_id": user.id}


@router.get("/users")
async def get_all_staff(db: AsyncSession = Depends(get_session)):
    """Fetch all doctors and lab techs."""
    stmt = select(User).where(User.role.in_(["doctor", "lab_technician", "admin"]))
    res = await db.execute(stmt)
    users = res.scalars().all()
    
    return [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "phone": u.phone
    } for u in users]


@router.get("/patients/search")
async def search_patients(q: str, db: AsyncSession = Depends(get_session)):
    """Search for patients by name, email, or phone."""
    stmt = select(User).where(
        User.role == "patient",
        (User.name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")) | (User.phone.ilike(f"%{q}%"))
    ).limit(50)
    res = await db.execute(stmt)
    users = res.scalars().all()
    
    return [{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "phone": u.phone
    } for u in users]


@router.get("/patients/{patient_id}/history")
async def get_patient_history_admin(patient_id: int, db: AsyncSession = Depends(get_session)):
    """Fetch total historical data for a specific patient."""
    try:
        history = await fetch_patient_history(db, patient_id)
        return history
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/system-stats")
async def get_system_stats(db: AsyncSession = Depends(get_session)):
    """Fetch aggregated system metrics for Admin Dashboard."""
    patients_count = await db.scalar(select(func.count(User.id)).where(User.role == "patient")) or 0
    doctors_count = await db.scalar(select(func.count(User.id)).where(User.role == "doctor")) or 0
    labs_count = await db.scalar(select(func.count(User.id)).where(User.role == "lab_technician")) or 0
    
    total_appts = await db.scalar(select(func.count(Appointment.id))) or 0
    completed_appts = await db.scalar(select(func.count(Appointment.id)).where(Appointment.status == "completed")) or 0
    scheduled_appts = await db.scalar(select(func.count(Appointment.id)).where(Appointment.status == "scheduled")) or 0
    
    total_tests = await db.scalar(select(func.count(LabTestRequest.id))) or 0
    completed_tests = await db.scalar(select(func.count(LabTestRequest.id)).where(LabTestRequest.status == "completed")) or 0
    pending_tests = await db.scalar(select(func.count(LabTestRequest.id)).where(LabTestRequest.status == "pending")) or 0

    # Day-wise reports (Last 7 Days)
    seven_days_ago = dt.datetime.now() - dt.timedelta(days=7)
    day_wise_stmt = select(
        func.date(Appointment.datetime).label('date'),
        func.count(Appointment.id).label('total'),
        func.sum(case((Appointment.status == 'completed', 1), else_=0)).label('completed'),
        func.sum(case((Appointment.status == 'scheduled', 1), else_=0)).label('no_show')
    ).where(Appointment.datetime >= seven_days_ago).group_by(func.date(Appointment.datetime)).order_by(func.date(Appointment.datetime).desc())
    
    res = await db.execute(day_wise_stmt)
    records = res.all()
    day_wise = [
        {
            "date": str(r.date),
            "total": r.total,
            "completed": r.completed or 0,
            "no_show": r.no_show or 0
        }
        for r in records
    ]

    return {
        "users": {
            "patients": patients_count,
            "doctors": doctors_count,
            "lab_techs": labs_count
        },
        "appointments": {
            "total": total_appts,
            "completed": completed_appts,
            "scheduled": scheduled_appts
        },
        "lab_tests": {
            "total": total_tests,
            "completed": completed_tests,
            "pending": pending_tests
        },
        "day_wise_reports": day_wise
    }
