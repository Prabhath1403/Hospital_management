from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from db import get_session
from models import Medicine, User, DailyDose
from schemas import MedicineCreate, MedicineOut, DailyDoseOut
from auth import get_current_user
import datetime as dt

router = APIRouter()


@router.post("/", response_model=MedicineOut)
async def prescribe_medicine(
    payload: MedicineCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Doctor prescribes medicine to a patient. Requires user_id in payload."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can prescribe medicines",
        )

    medicine = Medicine(
        user_id=payload.user_id,
        doctor_id=current_user.id,
        appointment_id=payload.appointment_id,
        medicine_name=payload.medicine_name,
        dosage=payload.dosage,
        frequency=payload.frequency,
        duration_days=payload.duration_days,
        notes=payload.notes,
        start_date=dt.datetime.utcnow(),
    )
    session.add(medicine)
    await session.commit()
    await session.refresh(medicine)
    return medicine


@router.get("/patient", response_model=list[MedicineOut])
async def get_patient_medicines(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all medicines prescribed to the current patient."""
    result = await session.execute(
        select(Medicine).where(Medicine.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/{medicine_id}", response_model=MedicineOut)
async def get_medicine(
    medicine_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get a specific medicine (patient can see their own, doctor can see any)."""
    result = await session.execute(
        select(Medicine).where(Medicine.id == medicine_id)
    )
    medicine = result.scalar_one_or_none()

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    if current_user.role == "patient" and medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own medicines",
        )

    return medicine


@router.patch("/{medicine_id}/complete")
async def mark_medicine_complete(
    medicine_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Mark a medicine as completed by the patient."""
    result = await session.execute(
        select(Medicine).where(Medicine.id == medicine_id)
    )
    medicine = result.scalar_one_or_none()

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own medicines",
        )

    medicine.is_completed = 1
    session.add(medicine)
    await session.commit()
    await session.refresh(medicine)
    return {"detail": "Medicine marked as completed", "medicine": medicine}


@router.get("/doctor/patients-medicines", response_model=list)
async def doctor_get_prescribed_medicines(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all medicines prescribed by this doctor with patient info."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this",
        )
    
    result = await session.execute(
        select(Medicine).where(Medicine.doctor_id == current_user.id).order_by(Medicine.created_at.desc())
    )
    medicines = result.scalars().all()
    
    # Enrich with patient info
    response = []
    for med in medicines:
        patient = await session.get(User, med.user_id)
        response.append({
            "id": med.id,
            "medicine_name": med.medicine_name,
            "dosage": med.dosage,
            "frequency": med.frequency,
            "duration_days": med.duration_days,
            "start_date": med.start_date,
            "created_at": med.created_at,
            "is_completed": med.is_completed,
            "notes": med.notes,
            "patient_id": med.user_id,
            "patient_name": patient.name if patient else "Unknown",
            "patient_phone": patient.phone if patient else "",
            "days_elapsed": (dt.datetime.utcnow() - med.start_date).days if med.start_date else 0,
        })
    
    return response


@router.get("/doctor/analytics", response_model=dict)
async def doctor_analytics(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get compliance analytics for medicines prescribed by this doctor."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this",
        )
    
    result = await session.execute(
        select(Medicine).where(Medicine.doctor_id == current_user.id)
    )
    medicines = result.scalars().all()
    
    total_prescribed = len(medicines)
    completed = sum(1 for m in medicines if m.is_completed == 1)
    incomplete = total_prescribed - completed
    
    compliance_rate = (completed / total_prescribed * 100) if total_prescribed > 0 else 0
    
    # Analyze by patient
    patient_analytics = {}
    for med in medicines:
        if med.user_id not in patient_analytics:
            patient = await session.get(User, med.user_id)
            patient_analytics[med.user_id] = {
                "patient_name": patient.name if patient else "Unknown",
                "total_prescribed": 0,
                "completed": 0,
            }
        
        patient_analytics[med.user_id]["total_prescribed"] += 1
        if med.is_completed == 1:
            patient_analytics[med.user_id]["completed"] += 1
    
    # Calculate compliance per patient
    for pid in patient_analytics:
        data = patient_analytics[pid]
        data["compliance"] = (data["completed"] / data["total_prescribed"] * 100) if data["total_prescribed"] > 0 else 0
    
    return {
        "total_medicines_prescribed": total_prescribed,
        "completed": completed,
        "incomplete": incomplete,
        "overall_compliance": compliance_rate,
        "patient_analytics": patient_analytics,
    }


@router.get("/{medicine_id}/daily-doses", response_model=list[DailyDoseOut])
async def get_medicine_daily_doses(
    medicine_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get daily doses for a specific medicine (patient can see their own)."""
    # Verify medicine belongs to patient
    med_result = await session.execute(
        select(Medicine).where(Medicine.id == medicine_id)
    )
    medicine = med_result.scalar_one_or_none()

    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found",
        )

    if medicine.user_id != current_user.id and current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this medicine's doses",
        )

    result = await session.execute(
        select(DailyDose).where(DailyDose.medicine_id == medicine_id).order_by(DailyDose.dose_date)
    )
    return result.scalars().all()


@router.post("/{medicine_id}/daily-doses/confirm", response_model=dict)
async def confirm_daily_dose(
    medicine_id: int,
    dose_date_str: str,  # Format: YYYY-MM-DD
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Patient confirms they took the medicine on a specific date."""
    # Verify medicine belongs to patient
    med_result = await session.execute(
        select(Medicine).where(Medicine.id == medicine_id)
    )
    medicine = med_result.scalar_one_or_none()

    if not medicine or medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized",
        )

    # Parse the dose date
    try:
        dose_date = dt.datetime.strptime(dose_date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        )

    # Find or create daily dose record
    dose_result = await session.execute(
        select(DailyDose).where(
            and_(
                DailyDose.medicine_id == medicine_id,
                DailyDose.dose_date == dose_date,
            )
        )
    )
    daily_dose = dose_result.scalar_one_or_none()

    if not daily_dose:
        daily_dose = DailyDose(
            medicine_id=medicine_id,
            dose_date=dose_date,
            taken=1,
            confirmed_at=dt.datetime.utcnow(),
        )
        session.add(daily_dose)
    else:
        daily_dose.taken = 1
        daily_dose.confirmed_at = dt.datetime.utcnow()
        session.add(daily_dose)

    await session.commit()
    return {
        "detail": "Dose confirmed successfully",
        "medicine_id": medicine_id,
        "dose_date": dose_date_str,
        "taken": 1,
    }

