import asyncio
from db import engine, Base, AsyncSessionLocal
from models import Doctor, Department, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


async def seed():
    from sqlalchemy import text, select

    async with engine.begin() as conn:
        # create_all will create missing tables, but may not alter existing tables.
        await conn.run_sync(Base.metadata.create_all)
        # Ensure appointments.user_id column exists (safe to run repeatedly)
        await conn.execute(text("""
        ALTER TABLE IF EXISTS appointments
        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
        """))

    async with AsyncSessionLocal() as session:
        # Create doctor user accounts if they don't exist
        doctor_data = [
            {"name": "Dr. Aisha Patel", "email": "aisha.patel@hospital.com", "specialty": "Cardiology", "experience": "12 yrs", "fee": "$60"},
            {"name": "Dr. Miguel Chen", "email": "miguel.chen@hospital.com", "specialty": "General Medicine", "experience": "10 yrs", "fee": "$40"},
            {"name": "Dr. Sara Khan", "email": "sara.khan@hospital.com", "specialty": "Radiology", "experience": "8 yrs", "fee": "$55"},
        ]
        
        docs = []
        password_hash = pwd_context.hash("123456789")
        
        for doc_info in doctor_data:
            # Check if doctor user already exists
            existing = await session.execute(
                select(User).where(User.email == doc_info["email"])
            )
            doctor_user = existing.scalars().first()
            
            if not doctor_user:
                # Create doctor user account
                doctor_user = User(
                    name=doc_info["name"],
                    email=doc_info["email"],
                    password_hash=password_hash,
                    phone="",
                    role="doctor"
                )
                session.add(doctor_user)
                await session.flush()  # Get the ID
            
            # Create doctor profile linked to user
            doctor = Doctor(
                name=doc_info["name"],
                specialty=doc_info["specialty"],
                experience=doc_info["experience"],
                fee=doc_info["fee"],
                user_id=doctor_user.id  # Link to user account
            )
            docs.append(doctor)
        
        depts = [
            Department(name="Cardiology", description="Cath Lab, ECG, Echo, cardiac ICU."),
            Department(name="Emergency & ICU", description="24/7 trauma, stroke code."),
            Department(name="Diagnostics", description="Bloods, X-Ray, CT, MRI, Ultrasound."),
            Department(name="General Medicine", description="Primary and chronic care."),
        ]
        
        session.add_all(docs + depts)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())

