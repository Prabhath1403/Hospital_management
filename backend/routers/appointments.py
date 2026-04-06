from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from db import get_session
from models import Appointment, User, Doctor, Department
from schemas import AppointmentCreate, AppointmentOut
from auth import get_current_user
import datetime as dt

router = APIRouter()


@router.post("/", response_model=AppointmentOut)
async def create_appointment(
    payload: AppointmentCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Create appointment and associate with the authenticated user."""
    try:
        # Validate doctor exists if provided
        if payload.doctorId:
            doctor_check = await session.execute(
                select(Doctor).where(Doctor.id == payload.doctorId)
            )
            if not doctor_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Doctor with id {payload.doctorId} not found"
                )
        
        # Validate department exists if provided
        if payload.departmentId:
            dept_check = await session.execute(
                select(Department).where(Department.id == payload.departmentId)
            )
            if not dept_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Department with id {payload.departmentId} not found"
                )
        
        # Strip timezone info to avoid mismatch with naive created_at
        appointment_datetime = payload.datetime
        if appointment_datetime and appointment_datetime.tzinfo:
            appointment_datetime = appointment_datetime.replace(tzinfo=None)
        
        appt = Appointment(
            name=payload.name,
            phone=payload.phone,
            datetime=appointment_datetime,
            doctor_id=payload.doctorId,
            department_id=payload.departmentId,
            symptoms=payload.symptoms,
            payment=payload.payment,
            user_id=current_user.id,
            created_at=dt.datetime.utcnow(),
        )
        session.add(appt)
        await session.commit()
        await session.refresh(appt)
        return appt
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to book appointment: {str(e)}"
        )


@router.get("/", response_model=list[AppointmentOut])
async def list_appointments(session: AsyncSession = Depends(get_session)):
    """Return recent appointments (admin/any)."""
    res = await session.execute(select(Appointment).order_by(Appointment.created_at.desc()).limit(20))
    return res.scalars().all()


@router.get("/upcoming", response_model=list[AppointmentOut])
async def upcoming_appointments(session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Return upcoming appointments for the authenticated patient ordered by datetime."""
    now = dt.datetime.utcnow()
    res = await session.execute(
        select(Appointment).where(
            and_(
                Appointment.user_id == current_user.id, 
                Appointment.datetime >= now,
                Appointment.status == "scheduled"
            )
        ).order_by(Appointment.datetime.asc())
    )
    return res.scalars().all()


@router.get("/doctor", response_model=list[AppointmentOut])
async def doctor_appointments(session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Return appointments for the authenticated doctor ordered by datetime.
    Shows both appointments assigned to this doctor and unassigned appointments (general queue)."""
    if current_user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a doctor")
    
    # Get the doctor record for this user
    doctor_result = await session.execute(
        select(Doctor).where(Doctor.user_id == current_user.id)
    )
    doctor = doctor_result.scalars().first()
    
    if not doctor:
        # Return empty list if no doctor record found
        return []
    
    # Get appointments for this doctor OR unassigned appointments
    # This allows doctors to see all available appointments in the queue
    res = await session.execute(
        select(Appointment).where(
            (Appointment.doctor_id == doctor.id) | (Appointment.doctor_id == None)
        ).order_by(Appointment.datetime.desc())
    )
    return res.scalars().all()


@router.patch("/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    body: dict = None,
):
    """Mark appointment as completed with an optional diagnosis."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can complete appointments",
        )
    
    # Get the doctor record for this user
    doctor_result = await session.execute(
        select(Doctor).where(Doctor.user_id == current_user.id)
    )
    doctor = doctor_result.scalars().first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor record not found",
        )
    
    result = await session.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    
    # Allow completing if appointment is assigned to this doctor or is unassigned (from general queue)
    if appointment.doctor_id is not None and appointment.doctor_id != doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own appointments",
        )
    
    # If appointment was unassigned, assign it to this doctor before completing
    if appointment.doctor_id is None:
        appointment.doctor_id = doctor.id
    
    appointment.status = "completed"
    appointment.completed_at = dt.datetime.utcnow()
    
    # Save diagnosis if provided
    if body and body.get("diagnosis"):
        appointment.diagnosis = body["diagnosis"]
    
    session.add(appointment)
    await session.commit()
    await session.refresh(appointment)
    return appointment
