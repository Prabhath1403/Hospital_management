"""
Patient analytics endpoints.
POST /api/patients/{patient_id}/analyze  — queue AI analysis
GET  /api/patients/analysis/status/{task_id} — poll task status
"""
from fastapi import APIRouter, Query
from tasks import celery_app

router = APIRouter()


@router.post("/{patient_id}/analyze")
async def analyze_patient(patient_id: int, doctor_id: int = Query(...)):
    """Queue a Celery task to analyze patient history with Groq AI."""
    task = celery_app.send_task(
        "analyze_patient_history",
        args=[patient_id, doctor_id],
    )
    return {"status": "queued", "task_id": task.id}


@router.get("/analysis/status/{task_id}")
async def analysis_status(task_id: str):
    """Check the status of a patient analysis task."""
    result = celery_app.AsyncResult(task_id)
    response = {
        "task_id": task_id,
        "status": result.status,
    }
    if result.ready():
        response["result"] = result.result
    return response
