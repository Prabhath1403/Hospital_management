"""
Diagnostics Router
Handles Lab Test Requests and Results for Lab Workflow.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import datetime

from db import get_session
from models import LabTestRequest, LabTestResult, User

router = APIRouter()

# --- Pydantic Schemas ---
class PrescribeTestReq(BaseModel):
    patient_id: int
    doctor_id: int
    test_name: str
    reason: str

class UploadResultReq(BaseModel):
    technician_id: int
    result_data: str

# --- Endpoints ---

@router.get("/")
async def list_tests():
    # Legacy endpoint for test catalog
    return [
        {"name": "Complete Blood Count (CBC)", "price": "$30"},
        {"name": "Lipid Profile", "price": "$40"},
        {"name": "ECG", "price": "$20"},
        {"name": "X-Ray", "price": "$40"},
        {"name": "CT Scan", "price": "$180"},
        {"name": "MRI", "price": "$240"},
        {"name": "Ultrasound", "price": "$80"},
    ]

@router.post("/prescribe")
async def prescribe_lab_test(req: PrescribeTestReq, db: AsyncSession = Depends(get_session)):
    """Doctor prescribes a new lab test."""
    test_req = LabTestRequest(
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        test_name=req.test_name,
        reason=req.reason,
        status="pending"
    )
    db.add(test_req)
    await db.commit()
    await db.refresh(test_req)
    return {"status": "success", "request_id": test_req.id}

@router.get("/pending")
async def get_pending_tests(db: AsyncSession = Depends(get_session)):
    """Lab technician views all pending tests."""
    stmt = (
        select(LabTestRequest)
        .where(LabTestRequest.status == "pending")
        .options(
            selectinload(LabTestRequest.patient),
            selectinload(LabTestRequest.doctor)
        )
        .order_by(LabTestRequest.requested_at.desc())
    )
    result = await db.execute(stmt)
    requests = result.scalars().all()
    
    return [{
        "id": req.id,
        "patient_name": req.patient.name if req.patient else "Unknown",
        "doctor_name": req.doctor.name if req.doctor else "Unknown",
        "test_name": req.test_name,
        "reason": req.reason,
        "requested_at": req.requested_at.isoformat() if req.requested_at else None
    } for req in requests]

@router.post("/{request_id}/result")
async def upload_test_result(request_id: int, req: UploadResultReq, db: AsyncSession = Depends(get_session)):
    """Lab technician uploads the test findings."""
    # Find request
    request_stmt = select(LabTestRequest).where(LabTestRequest.id == request_id)
    result = await db.execute(request_stmt)
    test_req = result.scalars().first()
    
    if not test_req:
        raise HTTPException(status_code=404, detail="Test request not found")
    if test_req.status == "completed":
        raise HTTPException(status_code=400, detail="Test already has results uploaded")

    # Create Result
    test_res = LabTestResult(
        request_id=request_id,
        technician_id=req.technician_id,
        result_data=req.result_data
    )
    db.add(test_res)
    
    # Complete Request
    test_req.status = "completed"
    await db.commit()
    
    return {"status": "success", "result_id": test_res.id}

@router.get("/patient/{patient_id}")
async def get_patient_tests(patient_id: int, db: AsyncSession = Depends(get_session)):
    """Fetch all completed tests with results for a patient."""
    stmt = (
        select(LabTestRequest)
        .where(LabTestRequest.patient_id == patient_id)
        .options(
            selectinload(LabTestRequest.result),
            selectinload(LabTestRequest.doctor)
        )
        .order_by(LabTestRequest.requested_at.desc())
    )
    db_result = await db.execute(stmt)
    requests = db_result.scalars().all()
    
    return [{
        "request_id": req.id,
        "test_name": req.test_name,
        "reason": req.reason,
        "status": req.status,
        "requested_at": req.requested_at.isoformat() if req.requested_at else None,
        "doctor_name": req.doctor.name if req.doctor else "Unknown",
        "result_data": req.result.result_data if req.result else None,
        "uploaded_at": req.result.uploaded_at.isoformat() if req.result and req.result.uploaded_at else None
    } for req in requests]
