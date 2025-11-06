import httpx
from config import ABUSEIPDB_API_KEY

class AbuseipdbClient:
    name = "abuseipdb"

    async def fetch(self, ip: str):
        if not ABUSEIPDB_API_KEY:
            return {"error": "Missing AbuseIPDB key"}
        url = "https://api.abuseipdb.com/api/v2/check"
        headers = {"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"}
        params = {"ipAddress": ip, "maxAgeInDays": "90"}
        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, params=params, timeout=10)
            r.raise_for_status()
            return r.json()

    def normalize(self, raw):
        data = raw.get("data", {})
        score = data.get("abuseConfidenceScore", 0)
        total = data.get("totalReports", 0)
        return {
            "provider": self.name,
            "raw_score": score / 100.0,
            "categories": ["botnet"] if score > 70 else (["suspicious"] if score > 30 else []),
            "confidence": 0.9
        }
