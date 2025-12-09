from fastapi import APIRouter

router = APIRouter()


@router.get("/faqs")
async def faqs():
    return [
        {"q": "Do you offer 24/7 emergency care?", "a": "Yes, with ICU and trauma coverage."},
        {"q": "Which insurance plans are accepted?", "a": "Major providers; present your card at reception."},
        {"q": "Can I pay online?", "a": "UPI, cards, and net banking supported."},
    ]


@router.get("/tips")
async def tips():
    return [
        "Hydrate and maintain balanced nutrition.",
        "Routine screening for BP, sugar, cholesterol.",
        "30 minutes of activity daily after consulting your doctor."
    ]

