from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from db import get_session
from models import User, HealthMetric, HealthAlert
from auth import get_current_user
import datetime as dt

router = APIRouter()

class VitalsCreate(BaseModel):
    patient_id: int
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    blood_sugar: Optional[float] = None
    bmi: Optional[float] = None
    heart_rate: Optional[int] = None

class AlertCreate(BaseModel):
    patient_id: int
    alert_type: str
    severity: str
    message: str

@router.post("/vitals")
async def add_vitals(payload: VitalsCreate, db: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    user = await db.get(User, payload.patient_id)
    if not user:
         raise HTTPException(status_code=404, detail="Patient not found")
    metric = HealthMetric(
        user_id=payload.patient_id,
        bp_systolic=payload.bp_systolic,
        bp_diastolic=payload.bp_diastolic,
        blood_sugar=payload.blood_sugar,
        bmi=payload.bmi,
        heart_rate=payload.heart_rate,
    )
    db.add(metric)
    await db.commit()
    return {"message": "Vitals recorded successfully"}

@router.post("/alerts")
async def add_alert(payload: AlertCreate, db: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    user = await db.get(User, payload.patient_id)
    if not user:
         raise HTTPException(status_code=404, detail="Patient not found")
    alert = HealthAlert(
        user_id=payload.patient_id,
        alert_type=payload.alert_type,
        severity=payload.severity,
        message=payload.message
    )
    db.add(alert)
    await db.commit()
    return {"message": "Alert added successfully"}

class DemographicUpdate(BaseModel):
    date_of_birth: Optional[dt.date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None

@router.patch("/demographics/{patient_id}")
async def update_demographics(patient_id: int, payload: DemographicUpdate, db: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    user = await db.get(User, patient_id)
    if not user:
         raise HTTPException(status_code=404, detail="Patient not found")
    
    if payload.date_of_birth is not None:
        user.date_of_birth = payload.date_of_birth
    if payload.gender is not None:
        user.gender = payload.gender
    if payload.blood_group is not None:
        user.blood_group = payload.blood_group
        
    await db.commit()
    return {"message": "Demographics updated"}

@router.get("/my-health-summary")
async def get_my_health_summary(db: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Patient-facing endpoint: returns their full health record summary."""
    from queries.patient_analytics import fetch_patient_history
    from sqlalchemy import select, func
    from models import Medicine, Appointment

    try:
        history = await fetch_patient_history(db, current_user.id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Patient record not found")

    # Also fetch completed medications for condition context
    completed_meds_result = await db.execute(
        select(Medicine).where(
            Medicine.user_id == current_user.id,
            Medicine.is_completed == 1,
        ).order_by(Medicine.start_date.desc()).limit(10)
    )
    completed_meds = completed_meds_result.scalars().all()
    past_medications = [
        {
            "drug_name": m.medicine_name,
            "dosage": m.dosage,
            "condition_for": m.notes or "N/A",
            "start_date": m.start_date.isoformat() if m.start_date else None,
        }
        for m in completed_meds
    ]

    # Fetch completed appointments for diagnosis context
    completed_appts_result = await db.execute(
        select(Appointment).where(
            Appointment.user_id == current_user.id,
            Appointment.status == "completed",
        ).order_by(Appointment.completed_at.desc()).limit(5)
    )
    completed_appts = completed_appts_result.scalars().all()
    past_visits = [
        {
            "name": a.name,
            "symptoms": a.symptoms or "N/A",
            "diagnosis": a.diagnosis or None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        }
        for a in completed_appts
    ]

    history["past_medications"] = past_medications
    history["past_visits"] = past_visits

    return history
