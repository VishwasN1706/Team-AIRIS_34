# backend/providers/shodan.py
import httpx
from config import os, load_dotenv  # harmless; config already loads env
from config import VIRUSTOTAL_API_KEY  # imported to ensure config is referenced
from config import ABUSEIPDB_API_KEY
#from config import None  # placeholder to keep style consistent (no-op)

# Instead of importing from config twice, just read key directly:
import os as _os
SHODAN_API_KEY = _os.getenv("SHODAN_API_KEY", "")

class ShodanClient:
    name = "shodan"

    async def fetch(self, ip: str):
        if not SHODAN_API_KEY:
            # keep behavior consistent with other providers: return an error object
            return {"error": "Missing Shodan API key"}
        url = f"https://api.shodan.io/shodan/host/{ip}"
        params = {"key": SHODAN_API_KEY}
        async with httpx.AsyncClient() as client:
            r = await client.get(url, params=params, timeout=15)
            # do NOT raise for status here; return response text for raw output handling in app
            # but we will still capture non-200 body
            try:
                r.raise_for_status()
            except Exception:
                # return raw error payload to surface it to the caller
                text = r.text
                return {"http_status": r.status_code, "body": text}
            return r.json()

    def normalize(self, raw):
        # We are showing raw outputs only in your current app; keep a minimal normalize for compatibility
        # If raw contains error wrapper, just return empty summary
        if raw is None or ("http_status" in raw and raw.get("http_status") != 200):
            return {"provider": self.name, "raw_score": 0, "categories": [], "confidence": 0}
        # Shodan doesn't give a single 'score' — we return a small heuristic if needed
        ports = raw.get("ports", [])
        raw_score = min(1.0, len(ports) / 10) if ports else 0.0
        return {"provider": self.name, "raw_score": raw_score, "categories": [], "confidence": 0.6}
