# 🤖 Gemini AI Integration Setup Guide

## Getting Your Gemini API Key

### Step 1: Go to Google AI Studio

1. Visit: https://aistudio.google.com/apikey
2. Sign in with your Google account (or create one if needed)

### Step 2: Create API Key

1. Click on **"Create API key"** button
2. Select or create a Google Cloud project
3. Copy your API key

### Step 3: Add to Environment

#### Option A: Docker (Recommended)

Edit `infra/.env`:

```env
GEMINI_API_KEY=your-api-key-here
```

Then update `infra/compose.yaml` to pass the environment variable:

```yaml
backend:
  environment:
    - GEMINI_API_KEY=${GEMINI_API_KEY}
```

#### Option B: Local Development

Edit `backend/.env`:

```env
GEMINI_API_KEY=your-api-key-here
```

### Step 4: Restart Services

**Docker:**

```bash
cd infra
docker-compose down
docker-compose up -d
```

**Local:**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## What Gemini AI Does in Your App

### AI Symptom Checker

- **Analyzes symptoms** using natural language understanding
- **Recommends specialists** based on symptom analysis
- **Suggests tests** relevant to the symptoms
- **Confidence scoring** for recommendations

### Medical Report Analysis

- **Vision AI** analyzes uploaded medical images
- **Supports**: JPG, PNG, GIF, WebP, PDF
- **Provides insights** without replacing professional diagnosis

## Testing

1. Go to: http://localhost:8080
2. Click "🤖 AI Checker" or "AI Symptom Checker"
3. Enter symptoms like:
   - "I have chest pain and shortness of breath"
   - "Severe headache and neck stiffness"
   - "Persistent stomach ache and nausea"
4. Optionally upload a medical report/image
5. Get AI-powered analysis!

## Important Notes

⚠️ **This is NOT Medical Diagnosis**

- AI analysis is for informational purposes only
- Always consult qualified healthcare professionals
- Never rely solely on AI for medical decisions

✅ **Free Tier Available**

- Google offers a free tier for Gemini API
- Check: https://ai.google.dev/pricing

🔐 **Security**

- Never commit API key to git
- Use environment variables only
- Regenerate key if accidentally exposed

## Troubleshooting

### "GEMINI_API_KEY not found"

- Check that `.env` file exists in backend folder
- Verify API key is correctly set
- For Docker: restart containers with `docker-compose up -d`

### "Invalid API key"

- Go to https://aistudio.google.com/apikey
- Create a new API key
- Ensure it's correctly copied (no extra spaces)

### "Quota exceeded"

- Check your usage at: https://console.cloud.google.com/
- Free tier has rate limits
- Consider upgrading to paid tier if needed

## Features Enabled

✅ Symptom Analysis with Gemini Pro
✅ Medical Image Analysis with Gemini Vision
✅ Specialist Recommendation
✅ Recommended Tests
✅ Doctor Profile Matching
✅ Real AI-powered responses (not keyword matching)
