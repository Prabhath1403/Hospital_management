"""
Async query to fetch a patient's full medical history for analytics.
"""
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models import User, HealthMetric, HealthAlert, Medicine, DietLog, FoodItem
import datetime as dt


async def fetch_patient_history(session: AsyncSession, patient_id: int) -> dict:
    """
    Fetch comprehensive patient data for AI analysis.
    Returns a dict with profile, vitals, medications, alerts, and diet summary.
    """
    # --- Patient Profile ---
    user = await session.get(User, patient_id)
    if not user:
        raise ValueError(f"Patient with id {patient_id} not found")

    age = "N/A"
    if user.date_of_birth:
        today = dt.date.today()
        age = today.year - user.date_of_birth.year - ((today.month, today.day) < (user.date_of_birth.month, user.date_of_birth.day))
    profile = {
        "name": user.name,
        "age": age,
        "gender": user.gender or "N/A",
        "blood_group": user.blood_group or "N/A",
    }

    # --- Last 10 Health Metrics ---
    metrics_result = await session.execute(
        select(HealthMetric)
        .where(HealthMetric.user_id == patient_id)
        .order_by(HealthMetric.recorded_at.desc())
        .limit(10)
    )
    metrics = metrics_result.scalars().all()
    vitals = []
    for m in metrics:
        vitals.append({
            "bp_systolic": m.bp_systolic,
            "bp_diastolic": m.bp_diastolic,
            "blood_sugar": m.blood_sugar,
            "bmi": m.bmi,
            "heart_rate": m.heart_rate,
            "recorded_at": m.recorded_at.isoformat() if m.recorded_at else None,
        })

    # --- Active Medications ---
    meds_result = await session.execute(
        select(Medicine)
        .where(
            and_(
                Medicine.user_id == patient_id,
                Medicine.is_completed == 0,
            )
        )
        .order_by(Medicine.start_date.desc())
    )
    meds = meds_result.scalars().all()
    medications = []
    for med in meds:
        medications.append({
            "drug_name": med.medicine_name,
            "dosage": med.dosage,
            "condition_for": med.notes or "N/A",
            "start_date": med.start_date.isoformat() if med.start_date else None,
        })

    # --- Last 10 Health Alerts ---
    alerts_result = await session.execute(
        select(HealthAlert)
        .where(HealthAlert.user_id == patient_id)
        .order_by(HealthAlert.created_at.desc())
        .limit(10)
    )
    alerts = alerts_result.scalars().all()
    health_alerts = []
    for a in alerts:
        health_alerts.append({
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })

    # --- Diet Summary (Last 7 Days) ---
    seven_days_ago = dt.date.today() - dt.timedelta(days=7)
    diet_result = await session.execute(
        select(
            func.coalesce(func.avg(FoodItem.calories), 0).label("avg_calories"),
            func.coalesce(func.avg(FoodItem.protein_g), 0).label("avg_protein"),
            func.coalesce(func.avg(FoodItem.carbs_g), 0).label("avg_carbs"),
            func.coalesce(func.avg(FoodItem.fat_g), 0).label("avg_fat"),
        )
        .join(DietLog, FoodItem.diet_log_id == DietLog.id)
        .where(
            and_(
                DietLog.user_id == patient_id,
                DietLog.log_date >= seven_days_ago,
            )
        )
    )
    diet_row = diet_result.one()
    diet_summary = {
        "avg_calories": round(float(diet_row.avg_calories), 1),
        "avg_protein": round(float(diet_row.avg_protein), 1),
        "avg_carbs": round(float(diet_row.avg_carbs), 1),
        "avg_fat": round(float(diet_row.avg_fat), 1),
    }

    return {
        "profile": profile,
        "vitals": vitals,
        "medications": medications,
        "alerts": health_alerts,
        "diet_summary": diet_summary,
    }
