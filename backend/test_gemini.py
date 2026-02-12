"""Test script to verify Gemini API connection"""
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-pro")

print(f"Testing Gemini API connection...")
print(f"API Key: {api_key[:10]}..." if api_key else "API Key: NOT SET")
print(f"Model: {model_name}")
print("-" * 50)

try:
    # Configure API
    genai.configure(api_key=api_key)
    
    # List available models
    print("\nAvailable models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name}")
    
    print("\n" + "-" * 50)
    print(f"\nTesting model: {model_name}")
    
    # Test the model
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Say 'Hello, this is a test!' in JSON format with a 'message' key.")
    
    print(f"\nResponse:")
    print(response.text)
    print("\n✅ SUCCESS! Gemini API is working correctly.")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\nTrying with 'gemini-pro' model...")
    
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content("Say hello")
        print(f"✅ 'gemini-pro' works! Response: {response.text[:100]}")
    except Exception as e2:
        print(f"❌ 'gemini-pro' also failed: {e2}")
