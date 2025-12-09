from fastapi import APIRouter, HTTPException

router = APIRouter()

SYMPTOMS = {
    "chest-pain": {
        "symptom": "Chest Pain",
        "specialists": ["Cardiologist"],
        "prevention": ["Quit smoking", "Exercise regularly", "Healthy diet", "Manage stress"],
        "tests": ["ECG", "Blood Pressure", "Cholesterol Test", "Troponin"],
        "doctors": [
            {
                "id": "doc_001",
                "name": "Dr. Rahul Verma",
                "specialization": "Cardiologist",
                "experience": 10,
                "image": "/images/cardiologist1.jpg",
                "rating": 4.8,
            },
            {
                "id": "doc_002",
                "name": "Dr. Meera Shah",
                "specialization": "Cardiologist",
                "experience": 11,
                "image": "/images/cardiologist2.jpg",
                "rating": 4.7,
            },
        ],
    },
    "fever": {
        "symptom": "Fever",
        "specialists": ["General Physician"],
        "prevention": ["Hydrate well", "Rest adequately", "Monitor temperature"],
        "tests": ["CBC", "CRP", "Vital signs"],
        "doctors": [
            {
                "id": "doc_010",
                "name": "Dr. Kavya Iyer",
                "specialization": "General Physician",
                "experience": 8,
                "image": "/images/gp1.jpg",
                "rating": 4.6,
            }
        ],
    },
}


@router.get("/")
async def list_symptoms():
    return [{"slug": k, "symptom": v["symptom"], "specialists": v["specialists"]} for k, v in SYMPTOMS.items()]


@router.get("/{slug}")
async def get_symptom(slug: str):
    data = SYMPTOMS.get(slug)
    if not data:
        raise HTTPException(status_code=404, detail="Symptom not found")
    return data

