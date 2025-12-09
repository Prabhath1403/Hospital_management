# 🤖 Real AI Gemini Integration - Quick Start

## What Changed?

The AI Symptom Checker now uses **Google Gemini AI** instead of keyword matching!

### Before (Rule-based)

- ❌ Keyword matching ("chest" → Cardiologist)
- ❌ Hard-coded responses
- ❌ Limited to predefined symptoms

### After (Gemini AI)

- ✅ Natural language understanding
- ✅ Real AI analysis of symptoms
- ✅ Flexible & intelligent responses
- ✅ Medical image analysis with vision AI
- ✅ Confidence-based recommendations

## Quick Setup (3 Steps)

### 1️⃣ Get Gemini API Key

```
Visit: https://aistudio.google.com/apikey
Click: Create API key
Copy: Your API key
```

### 2️⃣ Add to Environment

Edit `infra/.env`:

```env
GEMINI_API_KEY=paste-your-api-key-here
```

### 3️⃣ Restart Docker

```bash
cd infra
docker-compose down
docker-compose up -d
```

## Test It Out

1. Open: http://localhost:8080
2. Go to: AI Symptom Checker
3. Try symptoms like:
   - "I have severe chest pain and shortness of breath"
   - "Persistent headache with neck stiffness"
   - "Abdominal pain and constant nausea"

You'll get real AI analysis, not keyword matching! 🚀

## Features

✅ **Symptom Analysis** - Gemini Pro understands complex symptoms
✅ **Image Analysis** - Upload X-rays, medical reports (vision AI)
✅ **Specialist Recommendation** - AI-powered, not rule-based
✅ **Test Suggestions** - Intelligent test recommendations
✅ **Multiple Specialists** - Cardiologist, Gastroenterologist, Pulmonologist, Neurologist

## Important ⚠️

- This is **NOT a diagnosis tool**
- **Always consult doctors** for real medical decisions
- AI is for **informational purposes only**
- Never rely solely on this for health decisions

## Free Tier

✅ Google offers **free tier** for Gemini API
✅ Generous rate limits for development
✅ Perfect for testing and prototyping

See: https://ai.google.dev/pricing

## Need Help?

See full guide: `GEMINI_SETUP.md`
