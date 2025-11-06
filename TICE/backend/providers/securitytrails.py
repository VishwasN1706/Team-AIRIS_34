# backend/providers/securitytrails.py
import os
import httpx

# read key from environment (config already loads .env)
SECURITYTRAILS_API_KEY = os.getenv("SECURITYTRAILS_API_KEY", "")

class SecurityTrailsClient:
    name = "securitytrails"

    async def fetch(self, query: str):
        """
        query: IP or domain. SecurityTrails has endpoints for both.
        We'll try domain endpoint if query looks like a domain (contains a dot and not pure digits),
        otherwise use the IP endpoint.
        """
        if not SECURITYTRAILS_API_KEY:
            return {"error": "Missing SecurityTrails API key"}

        headers = {"APIKEY": SECURITYTRAILS_API_KEY, "Accept": "application/json"}

        # simple heuristic: treat as IP if only digits and dots
        is_ip = all(part.isdigit() for part in query.split(".")) if "." in query else False

        if is_ip:
            url = f"https://api.securitytrails.com/v1/ips/nearby/{query}"
            # Note: securitytrails has various IP endpoints (whois, history, nearby). We choose 'nearby' as example.
            params = {}
        else:
            url = f"https://api.securitytrails.com/v1/domain/{query}"
            params = {"children_only": "false"}  # example param; remove if undesired

        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(url, headers=headers, params=params, timeout=20)
            except Exception as e:
                return {"http_error": str(e)}
            # Surface non-200 responses as structured wrapper so frontend can display them
            if r.status_code != 200:
                return {"http_status": r.status_code, "body": r.text}
            try:
                return r.json()
            except Exception:
                # sometimes the API returns non-JSON; return text then
                return {"http_status": r.status_code, "body": r.text}

    def normalize(self, raw):
        """
        Optional: keep a tiny summary if you later want normalized fields.
        If raw is an error wrapper, return an empty summary.
        """
        if not isinstance(raw, dict) or raw.get("http_status"):
            return {"provider": self.name, "summary": {}, "confidence": 0}
        # Example summary for domain responses (if present)
        summary = {}
        if raw.get("records") is not None:
            # securitytrails domain endpoint often contains 'records' or 'subdomains'
            summary["subdomains_count"] = len(raw.get("subdomains", [])) if raw.get("subdomains") else 0
        if raw.get("whois"):
            summary["whois"] = {"registrant": raw["whois"].get("registrant") if raw["whois"] else None}
        return {"provider": self.name, "summary": summary, "confidence": 0.6}
