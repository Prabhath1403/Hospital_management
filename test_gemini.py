#!/usr/bin/env python3
import requests
import json
import time

url = 'http://localhost:8000/ai/triage'
data = {'symptoms': 'I have severe chest pain, shortness of breath, and dizziness for the past 2 hours'}

try:
    print("Testing Gemini AI Triage Endpoint...")
    print(f"URL: {url}")
    print(f"Symptoms: {data['symptoms']}")
    print("\nSending request...\n")
    
    response = requests.post(url, data=data, timeout=60)
    print(f'Status Code: {response.status_code}\n')
    
    if response.status_code == 200:
        result = response.json()
        print("=" * 60)
        print("✓ GEMINI AI RESPONSE RECEIVED!")
        print("=" * 60)
        print(f"\nSummary: {result.get('summary')}")
        print(f"\nSpecialist Suggestion: {result.get('specialistSuggestion')}")
        print(f"\nPossible Body Systems Affected: {', '.join(result.get('possibleSystems', []))}")
        print(f"\nRecommended Tests: {', '.join(result.get('recommendedTests', []))}")
        print(f"\nSafety Note: {result.get('safetyNote')}")
        
        print(f"\nRecommended Doctors:")
        if result.get('doctorProfiles'):
            for i, doc in enumerate(result['doctorProfiles'], 1):
                print(f"  {i}. {doc['name']} - {doc['specialization']} ({doc['experience']})")
                print(f"     {doc['description']}")
        
        print("\n" + "=" * 60)
        print("✓ GEMINI AI IS WORKING CORRECTLY!")
        print("=" * 60)
    else:
        print(f'Error: {response.text}')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')
