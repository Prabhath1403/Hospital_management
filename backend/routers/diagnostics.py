from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_tests():
  return [
      {"name": "Blood Panel", "price": "$30"},
      {"name": "ECG", "price": "$20"},
      {"name": "X-Ray", "price": "$40"},
      {"name": "CT Scan", "price": "$180"},
      {"name": "MRI", "price": "$240"},
      {"name": "Ultrasound", "price": "$80"},
  ]

