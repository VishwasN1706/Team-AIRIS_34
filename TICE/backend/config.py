import os
from dotenv import load_dotenv

# Explicitly point to the TICE/.env path
BASE_DIR = os.path.join(os.path.expanduser("~"), "TICE")
ENV_PATH = os.path.join(BASE_DIR, ".env")

print("🔍 Looking for .env at:", ENV_PATH)

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
    print("✅ .env file found and loaded")
else:
    print("❌ .env file not found at path:", ENV_PATH)

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY", "")

print("✅ Loaded VIRUSTOTAL_API_KEY:", bool(VIRUSTOTAL_API_KEY))
print("✅ Loaded ABUSEIPDB_API_KEY:", bool(ABUSEIPDB_API_KEY))
