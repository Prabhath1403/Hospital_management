from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_session
from models import Department
from schemas import DepartmentOut

router = APIRouter()


@router.get("/", response_model=list[DepartmentOut])
async def list_departments(session: AsyncSession = Depends(get_session)):
    res = await session.execute(select(Department))
    return res.scalars().all()

