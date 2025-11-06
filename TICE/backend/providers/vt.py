import httpx
from config import VIRUSTOTAL_API_KEY

class VtClient:
    name = "virustotal"

    async def fetch(self, ip: str):
        if not VIRUSTOTAL_API_KEY:
            return {"error": "Missing VirusTotal key"}
        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        async with httpx.AsyncClient() as client:
            r = await client.get(url, headers=headers, timeout=10)
            r.raise_for_status()
            return r.json()

    def normalize(self, raw):
        data = raw.get("data", {}).get("attributes", {})
        stats = data.get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        total = sum(stats.values()) or 1
        score = malicious / total
        return {
            "provider": self.name,
            "raw_score": score,
            "categories": ["malware"] if malicious > 0 else [],
            "confidence": 0.9
        }
