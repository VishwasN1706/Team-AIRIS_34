import requests
import json
import time
from datetime import datetime

# --- API KEYS (You can move these to .env for security) ---
VT_KEY = '7774cdd6342578cd2521aac72dc3937268f9393e0a330012a8da35dbefa94e48'
ABUSE_KEY = '58503a9542ff135101ebee7b847e43f27ccb59cfcb84431b2b95128a424dcba1110af3fa3cec8ce8'
IPINFO_TOKEN = '9dff85f5dc360b'


class ThreatIntelligenceEngine:
    def __init__(self):
        self.results = {}

    def get_virustotal(self, ip):
        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
        headers = {"x-apikey": VT_KEY}
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                return r.json()
            else:
                return {"error": r.text}
        except Exception as e:
            return {"error": str(e)}

    def get_abuseipdb(self, ip):
        url = "https://api.abuseipdb.com/api/v2/check"
        headers = {"Key": ABUSE_KEY, "Accept": "application/json"}
        params = {"ipAddress": ip, "maxAgeInDays": 90}
        try:
            r = requests.get(url, headers=headers, params=params, timeout=10)
            if r.status_code == 200:
                return r.json()
            else:
                return {"error": r.text}
        except Exception as e:
            return {"error": str(e)}

    def get_ipinfo(self, ip):
        url = f"https://ipinfo.io/{ip}?token={IPINFO_TOKEN}"
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                return r.json()
            else:
                return {"error": r.text}
        except Exception as e:
            return {"error": str(e)}

    def analyze(self, ip):
        vt = self.get_virustotal(ip)
        ab = self.get_abuseipdb(ip)
        ipinfo = self.get_ipinfo(ip)

        # --- Compute quick reputation summary ---
        vt_score = vt.get("data", {}).get("attributes", {}).get("last_analysis_stats", {}).get("malicious", 0)
        ab_score = ab.get("data", {}).get("abuseConfidenceScore", 0)
        rep_score = min(100, vt_score * 2 + ab_score / 2)

        if rep_score >= 70:
            verdict = "🚨 MALICIOUS"
        elif rep_score >= 40:
            verdict = "⚠ SUSPICIOUS"
        else:
            verdict = "✅ BENIGN"

        # --- Construct unified JSON output ---
        result = {
            "ip": ip,
            "timestamp": datetime.now().isoformat(),
            "sources": {
                "VirusTotal": vt,
                "AbuseIPDB": ab,
                "IPinfo": ipinfo
            },
            "summary": {
                "reputation_score": rep_score,
                "verdict": verdict,
                "geo": {
                    "country": ipinfo.get("country", "Unknown"),
                    "city": ipinfo.get("city", "Unknown"),
                    "org": ipinfo.get("org", "Unknown"),
                    "asn": ipinfo.get("org", "Unknown").split()[0] if "org" in ipinfo else "Unknown"
                }
            }
        }

        self.results[ip] = result
        return result
