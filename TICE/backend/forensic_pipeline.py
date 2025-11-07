import os, json, time, re
from datetime import datetime
from collections import defaultdict
import pandas as pd
import matplotlib.pyplot as plt
import networkx as nx
from pyvis.network import Network
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

# ---------------- Actor and Weight Configs ----------------
ACTOR_KEYWORDS = {
    "Mirai-family": ["mirai", "gafgyt", "bashlite", "telnet"],
    "Cobalt Strike": ["cobalt strike", "cobaltstrike"],
    "QakBot": ["qakbot", "qbot", "pinkslipbot"],
    "Emotet": ["emotet"],
    "LockBit": ["lockbit", "alphv", "blackcat"],
    "Generic Botnet": ["botnet", "c2", "command and control", "c&c"],
    "Phishing/Spam": ["phish", "spam", "credential", "smtp", "imap", "pop3"],
}

WEIGHTS = {
    "vt_malicious": 40,
    "abuse_confidence": 30,
    "otx_pulse": 20,
    "greynoise_malicious": 10
}

# ---------------- Utility Functions ----------------
def norm(text):
    return re.sub(r"\s+", " ", str(text).lower()).strip()

def contains_any(text, keywords):
    t = norm(text)
    for k in keywords:
        if k in t:
            return True
    return False

# ---------------- Main Generator ----------------
def generate_report(ip, raw_data, report_dir="reports"):
    """
    Generates a forensic correlation report PDF for one IP.
    Uses cached data (from /api/lookup/<ip>).
    Returns: path to generated PDF.
    """

    # --- Setup directories ---
    case_dir = os.path.join(report_dir, f"Case_{ip}_{datetime.utcnow().strftime('%Y%m%dT%H%M%S')}")
    os.makedirs(case_dir, exist_ok=True)

    # --- Extract key info ---
    vt = raw_data.get("raw_data", {}).get("VirusTotal", {})
    abuse = raw_data.get("raw_data", {}).get("AbuseIPDB", {})
    ipapi = raw_data.get("raw_data", {}).get("ipapi", {})
    shodan = raw_data.get("raw_data", {}).get("Shodan", {})

    vt_malicious = vt.get("data", {}).get("attributes", {}).get("last_analysis_stats", {}).get("malicious", 0)
    vt_suspicious = vt.get("data", {}).get("attributes", {}).get("last_analysis_stats", {}).get("suspicious", 0)
    abuse_conf = abuse.get("data", {}).get("abuseConfidenceScore", 0)
    open_ports = shodan.get("ports", [])
    asn_org = ipapi.get("as", "") or ipapi.get("org", "")
    country = ipapi.get("country", "")
    city = ipapi.get("city", "")

    # --- Threat confidence computation ---
    threat_conf = min(100, vt_malicious * 5 + vt_suspicious * 2 + abuse_conf * 0.5)
    verdict = "malicious" if threat_conf > 70 else "suspicious" if threat_conf > 30 else "benign"

    # --- Actor matching heuristic ---
    actor_scores = []
    all_text = json.dumps(raw_data).lower()
    for actor, kws in ACTOR_KEYWORDS.items():
        match_score = sum(contains_any(all_text, [k]) for k in kws) * 10
        actor_scores.append((actor, match_score))
    actor_scores.sort(key=lambda x: x[1], reverse=True)
    top_actor = actor_scores[0][0] if actor_scores else "Unknown"

    # --- Bar Chart: Threat Confidence ---
    plt.figure(figsize=(5, 3))
    plt.bar(["Threat Score"], [threat_conf], color="#e74c3c")
    plt.ylim(0, 100)
    plt.title("Threat Confidence Score")
    plt.ylabel("Score (0–100)")
    chart_path = os.path.join(case_dir, "threat_chart.png")
    plt.tight_layout()
    plt.savefig(chart_path, dpi=200)
    plt.close()

    # --- Network Graph (ASN - IP - Actor) ---
    G = nx.Graph()
    G.add_node(ip, node_type="ip", label=ip)
    G.add_node(asn_org or "Unknown ASN", node_type="asn", label=asn_org)
    G.add_node(top_actor, node_type="actor", label=top_actor)
    G.add_edges_from([(ip, top_actor), (ip, asn_org or "Unknown ASN")])

    plt.figure(figsize=(6, 5))
    pos = nx.spring_layout(G, seed=42)
    nx.draw_networkx_nodes(G, pos, nodelist=[ip], node_color="#e74c3c", node_size=700, label="IP")
    nx.draw_networkx_nodes(G, pos, nodelist=[top_actor], node_color="#f39c12", node_size=700, label="Actor")
    nx.draw_networkx_nodes(G, pos, nodelist=[asn_org], node_color="#3498db", node_size=700, label="ASN")
    nx.draw_networkx_labels(G, pos, font_size=8)
    nx.draw_networkx_edges(G, pos, width=1, alpha=0.7)
    plt.title("Actor Correlation Network")
    plt.axis("off")
    graph_png = os.path.join(case_dir, "actor_graph.png")
    plt.tight_layout()
    plt.savefig(graph_png, dpi=200)
    plt.close()

    # --- PDF Report ---
    pdf_path = os.path.join(case_dir, f"Forensic_Report_{ip}.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>Threat Intelligence Correlation & Attribution Report</b>", styles["Title"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"<b>Generated:</b> {datetime.utcnow().isoformat()}Z", styles["Normal"]))
    story.append(Paragraph(f"<b>Analyzed IP:</b> {ip}", styles["Normal"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Verdict:</b> {verdict.title()} ({int(threat_conf)}/100)", styles["Normal"]))
    story.append(Paragraph(f"<b>Top Associated Actor:</b> {top_actor}", styles["Normal"]))
    story.append(Paragraph(f"<b>Geolocation:</b> {city}, {country}", styles["Normal"]))
    story.append(Paragraph(f"<b>ASN/Organization:</b> {asn_org}", styles["Normal"]))
    story.append(Spacer(1, 12))

    table_data = [
        ["Feature", "Value"],
        ["VT Malicious Detections", str(vt_malicious)],
        ["VT Suspicious Detections", str(vt_suspicious)],
        ["AbuseIPDB Confidence", str(abuse_conf)],
        ["Open Ports", ", ".join(map(str, open_ports)) or "None"],
        ["Threat Confidence", f"{int(threat_conf)}/100"],
    ]

    tbl = Table(table_data, colWidths=[150, 300])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Threat Confidence Chart</b>", styles["Heading2"]))
    story.append(Image(chart_path, width=400, height=200))
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Actor Correlation Graph</b>", styles["Heading2"]))
    story.append(Image(graph_png, width=400, height=300))
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Summary:</b>", styles["Heading2"]))
    story.append(Paragraph(
        "This report consolidates OSINT intelligence from multiple sources (AbuseIPDB, VirusTotal, Shodan, IP-API). "
        "The above indicators were used to estimate threat confidence and infer likely actor attribution.",
        styles["Normal"]
    ))

    story.append(PageBreak())
    doc.build(story)

    return pdf_path