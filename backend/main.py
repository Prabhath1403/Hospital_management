from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import appointments, doctors, departments, diagnostics, resources, ai, realtime, symptoms, medicines
from auth import auth_router
from db import engine, Base, AsyncSessionLocal
from models import *  # Import all models for table creation
from sqlalchemy import text, select
from passlib.context import CryptContext
import models
import asyncio
import time

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

app = FastAPI(title="Healthcare Platform API")

_db_initialized = False

async def ensure_db_initialized():
    """Initialize database tables and seed data if not already done"""
    global _db_initialized
    if _db_initialized:
        return
    
    try:
        # Wait for database to be ready
        max_retries = 30
        for attempt in range(max_retries):
            try:
                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
                    # Ensure appointments.user_id column exists
                    await conn.execute(text("""
                    ALTER TABLE IF EXISTS appointments
                    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
                    """))
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(1)
                else:
                    raise
        
        # Seed initial data
        async with AsyncSessionLocal() as session:
            # Check if doctors already exist
            try:
                existing_doctors = await session.execute(select(models.Doctor))
                if not existing_doctors.scalars().first():
                    # Create departments
                    dept_data = [
                        {"name": "Cardiology", "description": "Heart and cardiovascular diseases"},
                        {"name": "General Medicine", "description": "General medical care"},
                        {"name": "Emergency & ICU", "description": "Emergency and intensive care"},
                        {"name": "Diagnostics", "description": "Diagnostic services"},
                    ]
                    
                    for dept_info in dept_data:
                        dept = models.Department(
                            name=dept_info["name"],
                            description=dept_info["description"]
                        )
                        session.add(dept)
                    
                    await session.flush()
                    
                    # Create doctor accounts
                    doctor_data = [
                        {"name": "Dr. Aisha Patel", "email": "aisha.patel@hospital.com", "specialty": "Cardiology", "experience": "12 yrs", "fee": "$60"},
                        {"name": "Dr. Miguel Chen", "email": "miguel.chen@hospital.com", "specialty": "General Medicine", "experience": "10 yrs", "fee": "$40"},
                        {"name": "Dr. Sara Khan", "email": "sara.khan@hospital.com", "specialty": "Radiology", "experience": "8 yrs", "fee": "$55"},
                    ]
                    
                    password_hash = pwd_context.hash("123456789")
                    
                    for doc_info in doctor_data:
                        doctor_user = models.User(
                            name=doc_info["name"],
                            email=doc_info["email"],
                            password_hash=password_hash,
                            phone="",
                            role="doctor"
                        )
                        session.add(doctor_user)
                        await session.flush()
                        
                        doctor = models.Doctor(
                            name=doc_info["name"],
                            user_id=doctor_user.id,
                            specialty=doc_info["specialty"],
                            experience=doc_info["experience"],
                            fee=doc_info["fee"]
                        )
                        session.add(doctor)
                    
                    await session.commit()
                    print("✅ Database initialized with seed data")
            except Exception as e:
                print(f"⚠️ Seeding error: {str(e)}")
        
        _db_initialized = True
    except Exception as e:
        print(f"⚠️ Database initialization failed: {str(e)}")

@app.on_event("startup")
async def startup_event():
    # Run initialization in background after a delay
    asyncio.create_task(ensure_db_initialized())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(doctors.router, prefix="/doctors", tags=["doctors"])
app.include_router(departments.router, prefix="/departments", tags=["departments"])
app.include_router(diagnostics.router, prefix="/diagnostics", tags=["diagnostics"])
app.include_router(resources.router, prefix="/resources", tags=["resources"])
app.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(realtime.router, prefix="/realtime", tags=["realtime"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["symptoms"])
app.include_router(medicines.router, prefix="/medicines", tags=["medicines"])


@app.get("/health")
async def health():
    return {"status": "ok"}

