"""
Celery task: analyze_patient_history
Fetches patient data, sends to Groq LLaMA 3.3 70B, publishes result to RabbitMQ.
"""
import os
import json
import logging
from celery import shared_task
from groq import Groq
import pika

from sqlalchemy import create_engine, select, func, and_
from sqlalchemy.orm import Session, sessionmaker, selectinload
from models import Base, User, HealthMetric, HealthAlert, Medicine, DietLog, FoodItem, LabTestRequest, LabTestResult
import datetime as dt

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Sync database session for Celery workers
# ---------------------------------------------------------------------------
_sync_database_url = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://app:app@postgres:5432/health"
).replace("postgresql+asyncpg", "postgresql+psycopg2")

_sync_engine = create_engine(_sync_database_url, echo=False)
SyncSessionLocal = sessionmaker(bind=_sync_engine, expire_on_commit=False)


# ---------------------------------------------------------------------------
# Helper: fetch patient history (sync version for Celery worker)
# ---------------------------------------------------------------------------
def _fetch_patient_history_sync(session: Session, patient_id: int) -> dict:
    """Synchronous version of the patient history query for Celery workers."""

    # --- Patient Profile ---
    user = session.get(User, patient_id)
    if not user:
        raise ValueError(f"Patient with id {patient_id} not found")

    profile = {
        "name": user.name,
        "age": "N/A",
        "gender": "N/A",
        "blood_group": "N/A",
    }

    # --- Last 10 Health Metrics ---
    metrics = (
        session.execute(
            select(HealthMetric)
            .where(HealthMetric.user_id == patient_id)
            .order_by(HealthMetric.recorded_at.desc())
            .limit(10)
        )
        .scalars()
        .all()
    )
    vitals = [
        {
            "bp_systolic": m.bp_systolic,
            "bp_diastolic": m.bp_diastolic,
            "blood_sugar": m.blood_sugar,
            "bmi": m.bmi,
            "heart_rate": m.heart_rate,
            "recorded_at": m.recorded_at.isoformat() if m.recorded_at else None,
        }
        for m in metrics
    ]

    # --- Active Medications ---
    meds = (
        session.execute(
            select(Medicine)
            .where(
                and_(
                    Medicine.user_id == patient_id,
                    Medicine.is_completed == 0,
                )
            )
            .order_by(Medicine.start_date.desc())
        )
        .scalars()
        .all()
    )
    medications = [
        {
            "drug_name": med.medicine_name,
            "dosage": med.dosage,
            "condition_for": med.notes or "N/A",
            "start_date": med.start_date.isoformat() if med.start_date else None,
        }
        for med in meds
    ]

    # --- Last 10 Health Alerts ---
    alerts = (
        session.execute(
            select(HealthAlert)
            .where(HealthAlert.user_id == patient_id)
            .order_by(HealthAlert.created_at.desc())
            .limit(10)
        )
        .scalars()
        .all()
    )
    health_alerts = [
        {
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]

    # --- Diet Summary (Last 7 Days) ---
    seven_days_ago = dt.date.today() - dt.timedelta(days=7)
    diet_row = session.execute(
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
    ).one()

    diet_summary = {
        "avg_calories": round(float(diet_row.avg_calories), 1),
        "avg_protein": round(float(diet_row.avg_protein), 1),
        "avg_carbs": round(float(diet_row.avg_carbs), 1),
        "avg_fat": round(float(diet_row.avg_fat), 1),
    }

    # --- Recent Lab Results ---
    tests = (
        session.execute(
            select(LabTestRequest)
            .where(
                and_(
                    LabTestRequest.patient_id == patient_id,
                    LabTestRequest.status == "completed"
                )
            )
            .options(selectinload(LabTestRequest.result))
            .order_by(LabTestRequest.requested_at.desc())
            .limit(5)
        )
        .scalars()
        .all()
    )
    
    lab_results = [
        {
            "test_name": t.test_name,
            "requested_at": t.requested_at.isoformat() if t.requested_at else None,
            "result_data": t.result.result_data if t.result else None,
            "uploaded_at": t.result.uploaded_at.isoformat() if t.result and t.result.uploaded_at else None
        } for t in tests
    ]

    return {
        "profile": profile,
        "vitals": vitals,
        "medications": medications,
        "alerts": health_alerts,
        "diet_summary": diet_summary,
        "lab_results": lab_results,
    }


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are an expert clinical decision support assistant integrated into a Hospital Management System.
Your role is to analyze a patient's historical medical data and generate a structured, 
actionable summary for the treating doctor.
Guidelines:
- Be clinical, precise, and concise
- Base observations strictly on the provided data — never assume or hallucinate values
- Pay strict attention to "RECENT LAB RESULTS", use them to determine if treatments are working
- Flag critical concerns clearly but avoid alarming language
- Always remind the doctor that this is AI-assisted analysis, not a final diagnosis
- Return ONLY valid JSON — no markdown, no preamble, no explanation outside the JSON"""


def _build_user_prompt(data: dict) -> str:
    p = data["profile"]
    vitals_str = "\n".join(
        f"  {i+1}. BP: {v['bp_systolic']}/{v['bp_diastolic']} | Sugar: {v['blood_sugar']} | "
        f"BMI: {v['bmi']} | HR: {v['heart_rate']} | Recorded: {v['recorded_at']}"
        for i, v in enumerate(data["vitals"])
    ) or "  No vitals recorded"

    meds_str = "\n".join(
        f"  - {m['drug_name']} ({m['dosage']}) for {m['condition_for']} since {m['start_date']}"
        for m in data["medications"]
    ) or "  No active medications"

    alerts_str = "\n".join(
        f"  - [{a['severity']}] {a['alert_type']}: {a['message']} ({a['created_at']})"
        for a in data["alerts"]
    ) or "  No recent alerts"
    
    labs_str = "\n".join(
        f"  - Test: {L['test_name']} (Requested: {L['requested_at']})\n    Result: {L['result_data']} (Uploaded: {L['uploaded_at']})"
        for L in data["lab_results"]
    ) or "  No recent lab results"

    ds = data["diet_summary"]

    return f"""Analyze the following patient's complete medical history and return a structured clinical summary.

=== PATIENT PROFILE ===
Name        : {p['name']}
Age         : {p['age']}
Gender      : {p['gender']}
Blood Group : {p['blood_group']}

=== VITALS HISTORY (Last 10 Readings) ===
{vitals_str}

=== ACTIVE MEDICATIONS ===
{meds_str}

=== RECENT HEALTH ALERTS ===
{alerts_str}

=== RECENT LAB RESULTS (CRITICAL) ===
{labs_str}

=== DIET SUMMARY (Last 7 Days) ===
Average Daily Calories : {ds['avg_calories']} kcal
Avg Protein            : {ds['avg_protein']} g
Avg Carbohydrates      : {ds['avg_carbs']} g
Avg Fat                : {ds['avg_fat']} g

=== TASK ===
Return ONLY a JSON object with exactly this structure:
{{
  "overall_status": {{
    "summary": "<2-3 sentence clinical snapshot>",
    "condition_trend": "<Improving | Stable | Deteriorating>",
    "critical_flag": <true | false>
  }},
  "risk_factors": [
    {{
      "factor": "<risk factor name>",
      "evidence": "<what in the data supports this>",
      "severity": "<Low | Medium | High | Critical>"
    }}
  ],
  "medication_concerns": [
    {{
      "concern": "<issue>",
      "drugs_involved": ["<drug1>"],
      "recommendation": "<what doctor should consider>"
    }}
  ],
  "diet_assessment": {{
    "summary": "<one sentence on nutritional adequacy>",
    "concerns": "<dietary risk based on condition>",
    "suggestion": "<specific dietary recommendation>"
  }},
  "recommended_followup": [
    {{
      "action": "<test / referral / review>",
      "reason": "<why based on data>",
      "priority": "<Routine | Urgent | Immediate>"
    }}
  ],
  "disclaimer": "This analysis is AI-generated and intended to assist clinical decision-making. Final diagnosis and treatment decisions rest with the treating physician."
}}"""


# ---------------------------------------------------------------------------
# Celery Task
# ---------------------------------------------------------------------------
@shared_task(name="analyze_patient_history", bind=True, max_retries=2)
def analyze_patient_history(self, patient_id: int, doctor_id: int):
    """
    Fetch patient data → call Groq LLaMA 3.3 70B → publish result to RabbitMQ.
    """
    try:
        # 1. Fetch patient history
        session = SyncSessionLocal()
        try:
            data = _fetch_patient_history_sync(session, patient_id)
        finally:
            session.close()

        # 2. Call Groq API
        groq_api_key = os.getenv("GROQ_API_KEY", "")
        if not groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not set")

        client = Groq(api_key=groq_api_key)
        user_prompt = _build_user_prompt(data)

        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )

        analysis = json.loads(chat_completion.choices[0].message.content)

        # 3. Publish to RabbitMQ
        amqp_url = os.getenv("AMQP_URL", "amqp://rabbitmq")
        payload = {
            "type": "PATIENT_ANALYSIS",
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "analysis": analysis,
        }

        try:
            connection = pika.BlockingConnection(
                pika.URLParameters(amqp_url)
            )
            channel = connection.channel()
            channel.exchange_declare(
                exchange="notifications", exchange_type="fanout", durable=False
            )
            channel.basic_publish(
                exchange="notifications",
                routing_key="",
                body=json.dumps(payload),
            )
            connection.close()
            logger.info(
                f"Published PATIENT_ANALYSIS for patient {patient_id} to RabbitMQ"
            )
        except Exception as rmq_err:
            logger.error(f"RabbitMQ publish failed: {rmq_err}")
            # Still return the analysis even if RabbitMQ fails
            pass

        return {
            "status": "completed",
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "analysis": analysis,
        }

    except Exception as exc:
        logger.error(f"analyze_patient_history failed: {exc}")
        raise self.retry(exc=exc, countdown=5)
