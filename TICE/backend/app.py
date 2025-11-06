from fastapi import FastAPI
import asyncio
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

# Import your API clients
from backend.providers.vt import VtClient
from backend.providers.abuseipdb import AbuseipdbClient
from backend.providers.ipapi import IpapiClient
from backend.providers.shodan import ShodanClient
from backend.providers.securitytrails import SecurityTrailsClient  # optional

# -------------------------------------------------------
# ⚙️ THREAT SCORING CONFIGURATION
# -------------------------------------------------------
WEIGHTS = {
    "abuseipdb": 0.4,
    "virustotal": 0.3,
    "asn": 0.2,
    "shodan": 0.1
}


def compute_threat_score(abuse_score, vt_detections, vt_total, asn_weight, shodan_flag):
    """Compute weighted threat score based on multiple indicators"""
    vt_ratio = (vt_detections / vt_total) * 100 if vt_total else 0
    shodan_score = 100 if shodan_flag else 0
    total_score = (
        WEIGHTS["abuseipdb"] * abuse_score +
        WEIGHTS["virustotal"] * vt_ratio +
        WEIGHTS["asn"] * (asn_weight * 100) +
        WEIGHTS["shodan"] * shodan_score
    )
    return round(total_score, 2)


def generate_threat_report(ip, abuse, vt, shodan, ipapi):
    """Combine all provider data into a single textual + structured report"""
    abuse_score = abuse.get("data", {}).get("abuseConfidenceScore", 0) if isinstance(abuse, dict) else 0

    vt_stats = vt.get("data", {}).get("attributes", {}).get("last_analysis_stats", {}) if isinstance(vt, dict) else {}
    vt_detections = vt_stats.get("malicious", 0)
    vt_total = sum(vt_stats.values()) if vt_stats else 1

    asn_weight = 0.5
    shodan_flag = bool(shodan.get("vulns") or shodan.get("tags"))
    ipapi_info = ipapi if isinstance(ipapi, dict) else {}

    total_score = compute_threat_score(abuse_score, vt_detections, vt_total, asn_weight, shodan_flag)

    # Verdict
    if total_score >= 70:
        verdict = "🚨 MALICIOUS"
    elif total_score >= 40:
        verdict = "⚠ SUSPICIOUS"
    else:
        verdict = "✅ BENIGN"

    # Threat categories
    categories = []
    if "botnet" in str(vt).lower() or "botnet" in str(abuse).lower():
        categories.append("Botnet")
    if "phish" in str(vt).lower():
        categories.append("Phishing")
    if any(p in [25, 587] for p in shodan.get("ports", [])):
        categories.append("Spam")
    if any(p in [8080, 1080] for p in shodan.get("ports", [])):
        categories.append("Proxy")
    if any(p in [6667, 1337] for p in shodan.get("ports", [])):
        categories.append("C2")

    # Format readable report
    report_text = f"""
------------------------------------------------------------
🧠 THREAT INTELLIGENCE CORRELATION ENGINE (TICE)
------------------------------------------------------------
Analysis Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
IP Address: {ip}
------------------------------------------------------------

📍 GEOLOCATION & NETWORK:
- Country: {ipapi_info.get("country", "Unknown")}
- City: {ipapi_info.get("city", "Unknown")}
- ASN: {ipapi_info.get("as", "Unknown")}
- ISP: {ipapi_info.get("org", "Unknown")}

🛡 THREAT SCORES:
- AbuseIPDB Confidence: {abuse_score}%
- VirusTotal Detections: {vt_detections}/{vt_total}
- ASN Weight: {asn_weight}
- Shodan Suspicious: {shodan_flag}
- Final Threat Score: {total_score}% → Verdict: {verdict}

💀 THREAT CATEGORIES:
- {', '.join(categories) if categories else 'No specific threat category detected.'}

🌐 RELATED DOMAINS / URLs:
- {', '.join(vt.get('related_domains', [])) if vt.get('related_domains') else 'None detected.'}

------------------------------------------------------------
"""

    print(report_text)

    return {
        "ip": ip,
        "score": total_score,
        "verdict": verdict,
        "categories": categories,
        "report_text": report_text
    }


# -------------------------------------------------------
# 🚀 FASTAPI BACKEND APP
# -------------------------------------------------------
app = FastAPI(title="Threat Intelligence Correlation Engine (TICE)")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for local development; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "TICE backend running"}


@app.get("/api/lookup/{ip}")
async def lookup(ip: str):
    """Fetch data from all APIs and generate final report"""
    vt = VtClient()
    ab = AbuseipdbClient()
    geo = IpapiClient()
    sh = ShodanClient()
    st = SecurityTrailsClient()

    # Run all providers concurrently
    results = await asyncio.gather(
        ab.fetch(ip),
        vt.fetch(ip),
        sh.fetch(ip),
        geo.fetch(ip),
        st.fetch(ip),
        return_exceptions=True
    )

    # Map results
    providers = ["AbuseIPDB", "VirusTotal", "Shodan", "ipapi", "SecurityTrails"]
    data = {}
    for provider, result in zip(providers, results):
        if isinstance(result, Exception):
            data[provider] = {"error": str(result)}
        else:
            data[provider] = result

    # Generate threat correlation report
    report = generate_threat_report(ip, data["AbuseIPDB"], data["VirusTotal"], data["Shodan"], data["ipapi"])

    # Final API output (raw + computed)
    return {
        "ip": ip,
        "timestamp": datetime.now().isoformat(),
        "raw_data": data,
        "threat_report": report
    }
