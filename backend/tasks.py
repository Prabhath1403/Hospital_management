import os
from celery import Celery

broker_url = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
backend_url = os.getenv("CELERY_BACKEND_URL", broker_url)

celery_app = Celery("tasks", broker=broker_url, backend=backend_url)


@celery_app.task
def send_confirmation(appointment_id: int):
    # stub task; integrate SMS/email
    return {"status": "sent", "appointment_id": appointment_id}

