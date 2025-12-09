from fastapi import APIRouter, UploadFile, File, Form
from schemas import TriageRequest, TriageResponse, DoctorProfile
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


async def analyze_symptoms_with_gemini(symptoms: str) -> dict:
    """
    Analyze symptoms using Google Gemini AI.
    Returns structured medical triage information.
    """
    try:
        if not GEMINI_API_KEY:
            return {
                "summary": "AI analysis unavailable. Please provide symptom details.",
                "systems": ["General check"],
                "specialist": "General Physician",
                "tests": ["CBC", "Basic Metabolic Panel"],
                "confidence": 0
            }
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""You are a medical triage assistant. Analyze the following symptoms and provide a structured response in JSON format.

Symptoms: {symptoms}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{{
    "summary": "Brief summary of symptoms",
    "possibleSystems": ["affected body systems"],
    "specialistSuggestion": "recommended specialist",
    "recommendedTests": ["suggested tests"],
    "confidence": 0-100,
    "disclaimer": "Important: This is not a diagnosis. Consult a medical professional."
}}

Be professional, accurate, and conservative in recommendations."""
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up response if it contains markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        import json
        result = json.loads(response_text)
        return result
        
    except Exception as e:
        print(f"Gemini AI error: {str(e)}")
        return {
            "summary": "General symptom analysis available",
            "systems": ["General check"],
            "specialist": "General Physician",
            "tests": ["CBC", "Basic Metabolic Panel"],
            "confidence": 0
        }


async def analyze_report_with_gemini(file_content: bytes, filename: str) -> str:
    """
    Analyze medical report/image using Gemini AI with vision capabilities.
    """
    try:
        if not GEMINI_API_KEY:
            return "📄 Document uploaded. Please consult with a medical professional for analysis."
        
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        # Determine MIME type
        mime_type = "image/jpeg"
        if filename.lower().endswith(".png"):
            mime_type = "image/png"
        elif filename.lower().endswith(".pdf"):
            mime_type = "application/pdf"
        elif filename.lower().endswith(".gif"):
            mime_type = "image/gif"
        elif filename.lower().endswith(".webp"):
            mime_type = "image/webp"
        
        # Create file content object
        file_content_obj = {
            "mime_type": mime_type,
            "data": file_content
        }
        
        prompt = """Please analyze this medical document or image and provide:
1. What you observe in the image/document
2. Possible areas of concern (if any)
3. Recommended specialist to review this
4. Important: This is NOT a diagnosis. It's preliminary analysis only.

Keep response brief and professional."""
        
        response = model.generate_content([prompt, file_content_obj])
        return response.text
        
    except Exception as e:
        print(f"Gemini Vision error: {str(e)}")
        return "📄 Document processed. Please consult with a medical professional for accurate interpretation."



@router.post("/triage", response_model=TriageResponse)
async def triage(
    symptoms: str = Form(...),
    report: UploadFile = File(None)
):
    """Triage symptoms with optional medical report/image analysis using Gemini AI."""
    text = symptoms.strip()
    report_analysis = None
    
    # Process uploaded file if provided
    if report:
        try:
            file_content = await report.read()
            report_analysis = await analyze_report_with_gemini(file_content, report.filename or "")
        except Exception as e:
            print(f"File upload error: {str(e)}")
            report_analysis = "Document processed. Please consult with a medical professional for accurate diagnosis."
    
    # Analyze symptoms using Gemini AI
    try:
        ai_analysis = await analyze_symptoms_with_gemini(text)
        
        # Get doctor profiles based on specialist
        specialist = ai_analysis.get("specialistSuggestion", "General Physician")
        doctors = get_doctor_profiles(specialist)
        
        safety_note = ai_analysis.get("disclaimer", "This is not a diagnosis. Please consult a qualified doctor for accurate evaluation.")
        
        return TriageResponse(
            summary=ai_analysis.get("summary", "Analysis complete"),
            possibleSystems=ai_analysis.get("possibleSystems", ["General check"]),
            specialistSuggestion=specialist,
            recommendedTests=ai_analysis.get("recommendedTests", ["CBC", "Basic Metabolic Panel"]),
            doctorProfiles=doctors,
            safetyNote=safety_note,
            reportAnalysis=report_analysis,
        )
    except Exception as e:
        print(f"Triage error: {str(e)}")
        # Fallback to basic analysis
        return TriageResponse(
            summary="General symptom analysis. Please consult a doctor.",
            possibleSystems=["General check"],
            specialistSuggestion="General Physician",
            recommendedTests=["CBC", "Basic Metabolic Panel"],
            doctorProfiles=get_doctor_profiles("General Physician"),
            safetyNote="This is not a diagnosis. Please consult a qualified doctor.",
            reportAnalysis=report_analysis,
        )


def get_doctor_profiles(specialist: str) -> list[DoctorProfile]:
    """Get doctor profiles based on specialist type."""
    doctors_by_specialty = {
        "Cardiologist": [
            DoctorProfile(
                name="Dr. Anjali Reddy",
                specialization="Cardiologist",
                experience="15+ years",
                hospital="Apollo Hospitals",
                image="/images/cardiologist1.jpg",
                description="Expert in heart-related issues, hypertension, and cardiac checkups.",
            ),
            DoctorProfile(
                name="Dr. Vivek Rao",
                specialization="Cardiologist",
                experience="14+ years",
                hospital="Apollo Hospitals",
                image="/images/cardiologist2.jpg",
                description="Handles chest discomfort, palpitations, and preventive cardiology.",
            ),
        ],
        "Gastroenterologist": [
            DoctorProfile(
                name="Dr. Kavya Nair",
                specialization="Gastroenterologist",
                experience="13+ years",
                hospital="Apollo Hospitals",
                image="/images/gastro1.jpg",
                description="Handles acidity, abdominal pain, and digestive issues.",
            ),
            DoctorProfile(
                name="Dr. Arjun Pillai",
                specialization="Gastroenterologist",
                experience="11+ years",
                hospital="Apollo Hospitals",
                image="/images/gastro2.jpg",
                description="Focus on liver, gut health, and nutritional guidance.",
            ),
        ],
        "Pulmonologist": [
            DoctorProfile(
                name="Dr. Rajesh Kumar",
                specialization="Pulmonologist",
                experience="12+ years",
                hospital="Apollo Hospitals",
                image="/images/pulmonologist1.jpg",
                description="Expert in respiratory conditions, asthma, and lung diseases.",
            ),
        ],
        "Neurologist": [
            DoctorProfile(
                name="Dr. Priya Sharma",
                specialization="Neurologist",
                experience="14+ years",
                hospital="Apollo Hospitals",
                image="/images/neurologist1.jpg",
                description="Specializes in headaches, migraines, and neurological disorders.",
            ),
        ],
    }
    
    # Return specialist doctors or default to General Physicians
    if specialist in doctors_by_specialty:
        return doctors_by_specialty[specialist]
    
    return [
        DoctorProfile(
            name="Dr. Anjali Reddy",
            specialization="General Physician",
            experience="12+ years",
            hospital="Apollo Hospitals",
            image="/images/gp1.jpg",
            description="Primary care, routine checkups, and preventive screening.",
        ),
        DoctorProfile(
            name="Dr. Ravi Mehta",
            specialization="Internal Medicine",
            experience="10+ years",
            hospital="Apollo Hospitals",
            image="/images/gp2.jpg",
            description="Manages fever, infections, and chronic conditions.",
        ),
    ]

