from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from datetime import datetime
import concurrent.futures
import subprocess
import requests
import os

# ==========================================================
# 🔐 API KEYS
# ==========================================================
VT_KEY = '7774cdd6342578cd2521aac72dc3937268f9393e0a330012a8da35dbefa94e48'
ABUSE_KEY = '58503a9542ff135101ebee7b847e43f27ccb59cfcb84431b2b95128a424dcba1110af3fa3cec8ce8'
IPINFO_TOKEN = '9dff85f5dc360b'

# ==========================================================
# 🚀 FASTAPI SETUP
# ==========================================================
app = FastAPI(title="TICE + Forensic Intelligence Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# 🧠 1️⃣ CORE TICE INTELLIGENCE LOOKUP
# ==========================================================
def gather_data(ip: str):
    """Collect data from multiple sources concurrently."""
    print(f"🔍 Gathering data for IP: {ip}")
    raw = {}

    def safe_request(name, func):
        try:
            return name, func()
        except Exception as e:
            return name, {"error": str(e)}

    def vt():
        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip}"
        r = requests.get(url, headers={"x-apikey": VT_KEY}, timeout=6)
        return r.json() if r.status_code == 200 else {"error": r.text}

    def ab():
        url = "https://api.abuseipdb.com/api/v2/check"
        r = requests.get(url, headers={"Key": ABUSE_KEY, "Accept": "application/json"},
                         params={"ipAddress": ip, "maxAgeInDays": 90}, timeout=6)
        return r.json() if r.status_code == 200 else {"error": r.text}

    def ipinfo():
        url = f"https://ipinfo.io/{ip}?token={IPINFO_TOKEN}"
        r = requests.get(url, timeout=6)
        return r.json() if r.status_code == 200 else {"error": r.text}

    # Run all lookups in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
        futures = [
            ex.submit(safe_request, "VirusTotal", vt),
            ex.submit(safe_request, "AbuseIPDB", ab),
            ex.submit(safe_request, "ipapi", ipinfo),
        ]
        for fut in futures:
            k, v = fut.result(timeout=10)
            raw[k] = v

    raw["Shodan"] = {"note": "Integration optional"}
    raw["SecurityTrails"] = {"note": "Integration optional"}

    return raw


def compute_threat_score(raw):
    """Compute unified threat score."""
    vt_data = raw.get("VirusTotal", {}).get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
    abuse_data = raw.get("AbuseIPDB", {}).get("data", {})

    malicious = vt_data.get("malicious", 0)
    total = sum(vt_data.values()) or 1
    vt_ratio = (malicious / total) * 100

    abuse_score = abuse_data.get("abuseConfidenceScore", 0)
    unified = round((vt_ratio * 0.5 + abuse_score * 0.5), 2)

    if unified >= 80:
        verdict = "🚨 MALICIOUS"
    elif unified >= 40:
        verdict = "⚠ SUSPICIOUS"
    else:
        verdict = "✅ BENIGN"

    return unified, verdict


def run_tice_workflow(ip: str):
    """Run quick TICE lookup for dashboard."""
    raw = gather_data(ip)
    score, verdict = compute_threat_score(raw)
    ipinfo_data = raw.get("ipapi", {})

    report_text = f"""
================================================================================
🧠 THREAT INTELLIGENCE CORRELATION ENGINE (TICE)
================================================================================
Analysis Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Target IP: {ip}

📍 GEOLOCATION:
- Country: {ipinfo_data.get('country', 'Unknown')}
- City: {ipinfo_data.get('city', 'Unknown')}
- ASN: {ipinfo_data.get('org', 'Unknown').split()[0] if 'org' in ipinfo_data else 'Unknown'}
- ISP: {ipinfo_data.get('org', 'Unknown')}

🛡 SCORES:
- Unified Reputation Score: {score}%
- Threat Level: {verdict}
- Confidence: 100%

💀 DETECTIONS:
- VirusTotal Malicious: {raw.get('VirusTotal', {}).get('data', {}).get('attributes', {}).get('last_analysis_stats', {}).get('malicious', 0)}
- AbuseIPDB: {raw.get('AbuseIPDB', {}).get('data', {}).get('abuseConfidenceScore', 0)}% ({raw.get('AbuseIPDB', {}).get('data', {}).get('totalReports', 0)} reports)
================================================================================
"""

    categories = []
    if "malicious" in str(raw.get("VirusTotal", {})).lower():
        categories.append("Malware")
    if "phish" in str(raw.get("VirusTotal", {})).lower():
        categories.append("Phishing")
    if "abuseConfidenceScore" in str(raw.get("AbuseIPDB", {})):
        categories.append("Abuse Activity")

    return {
        "ip": ip,
        "timestamp": datetime.now().isoformat(),
        "raw_data": raw,
        "threat_report": {
            "ip": ip,
            "score": score,
            "verdict": verdict.replace("🚨", "").replace("⚠", "").replace("✅", "").strip(),
            "categories": categories,
            "report_text": report_text
        }
    }

# ==========================================================
# 🧾 2️⃣ FORENSIC PIPELINE INTEGRATION
# ==========================================================
@app.get("/api/forensic/{ip}")
async def run_forensic_pipeline(ip: str, background_tasks: BackgroundTasks):
    """Run the forensic pipeline asynchronously."""
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    case_folder = f"Case_{timestamp}_{ip.replace('.', '_')}"
    os.makedirs(case_folder, exist_ok=True)

    log_file = os.path.join(case_folder, "forensic.log")
    pipeline_script = os.path.join(os.path.dirname(__file__), "forensic_pipeline.py")
    cmd = ["python", pipeline_script, ip]

    def run_pipeline():
        with open(log_file, "w") as f:
            subprocess.run(cmd, stdout=f, stderr=f, text=True)

    background_tasks.add_task(run_pipeline)

    return {
        "status": "running",
        "message": f"Forensic pipeline started for {ip}",
        "case_folder": case_folder,
        "log_file": log_file
    }

# ==========================================================
# 📥 3️⃣ REPORT DOWNLOAD ENDPOINT
# ==========================================================
@app.get("/api/report/{ip}")
async def download_forensic_report(ip: str):
    """Return forensic PDF report if available."""
    folders = [f for f in os.listdir(".") if f.startswith("Case_") and ip.replace('.', '_') in f]
    if not folders:
        return JSONResponse({"status": "processing", "message": "Report not yet generated."}, status_code=202)

    latest = sorted(folders)[-1]
    folder_path = os.path.join(".", latest)
    pdf_files = [f for f in os.listdir(folder_path) if f.endswith(".pdf")]

    if not pdf_files:
        return JSONResponse({"status": "processing", "message": "PDF not ready yet."}, status_code=202)

    pdf_path = os.path.join(folder_path, pdf_files[0])
    return FileResponse(
        path=pdf_path,
        filename=f"Forensic_Report_{ip}.pdf",
        media_type="application/pdf"
    )

# ==========================================================
# 🧭 4️⃣ HEALTH CHECK + QUICK LOOKUP
# ==========================================================
@app.get("/")
def home():
    return {"message": "✅ TICE + Forensic backend running properly"}

@app.get("/api/lookup/{ip}")
async def lookup(ip: str):
    print(f"🔎 Running TICE workflow for: {ip}")
    return run_tice_workflow(ip)
