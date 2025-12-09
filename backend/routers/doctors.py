from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
from models import Doctor
from schemas import DoctorOut

router = APIRouter()


@router.get("/", response_model=list[DoctorOut])
async def list_doctors(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Doctor))
    return res.scalars().all()

